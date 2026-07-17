# 019 — Add resource limits and missing healthchecks to production compose

Status: DONE — executed and live-verified in production
Written against commit: `74e98a3`
Category: Ops/DevOps | Impact: High | Effort: M | Risk of fix: Low | Confidence: High

## Post-execution incident notes (read before touching this file again)

Applying this plan caused a real (~30 min) production incident, entirely from pre-existing bugs
this plan's `--force-recreate` was the first thing in a long time to actually exercise. Root causes
and fixes, all now applied and live:

1. **`postgres`/`redis` got stuck in `Created` (never started)** after the very first
   `docker compose up -d --force-recreate` — likely a compose/daemon quirk recreating dependency
   services before their dependents were ready to be resolved by `--no-build`. Fixed in the moment
   with `docker start weelink-postgres-1 weelink-redis-1`. Data was never at risk (named volumes
   `weelink_prod_postgres`/`weelink_prod_redis` persisted throughout) but the API had no working DB
   for a few minutes. **If recreating this stack again, watch `docker ps` immediately after `up`
   and don't assume "Recreated" in the log means "Started."**
2. **`web`/`admin` service images only existed under the `:prod` tag**, not the `:latest` tag
   Compose implicitly looks for on some recreate paths — caused `api`'s recreate to fail outright
   with "No such image: weelink-api:latest". Fixed by also tagging `docker tag weelink-api:prod
   weelink-api:latest` (and same for `web`/`admin`). **Any future manual `docker commit ... :prod`
   deploy should also tag `:latest` to the same image, or this will recur.**
3. **Next.js standalone (`web`/`admin`) binds IPv4-only** (`HOSTNAME=0.0.0.0` in the Dockerfiles),
   but `localhost` inside the container resolves to `::1` (IPv6) first — so the healthchecks this
   plan added as `wget http://localhost:PORT/` always failed with "Connection refused" even though
   the app was running fine. Fixed by using `http://127.0.0.1:PORT/` instead, which is what's in
   this file now. `api`'s existing healthcheck was untouched since NestJS's default `app.listen()`
   binds dual-stack and `localhost` already worked there.
4. **`nginx.conf` proxies two `server_name` blocks (`medadplus.net`/`api.medadplus.net`) to
   `host.docker.internal`** — that's for an *entirely separate, unrelated project* ("مداد+") that
   runs directly on the host, not in this compose stack (see the comment at `nginx.conf:148`). This
   is intentional, not a bug — do not "fix" it by changing those `proxy_pass` targets. The actual
   gap was that `host.docker.internal` doesn't resolve on Linux Docker Engine without an explicit
   `extra_hosts: ["host.docker.internal:host-gateway"]` entry, which was missing from the `nginx`
   service. Added and confirmed working — this file now has it.
5. **`nginx`'s madad-plus SSL cert (`/etc/nginx/ssl-madad/madad.crt`) lived on the host but was
   never declared as a compose volume** — the long-running old `nginx` container (27h uptime before
   this plan touched it) must have gotten it some other way (manual `docker cp`, or an older compose
   file version) that didn't survive into this file. Added
   `- /etc/nginx/ssl-madad:/etc/nginx/ssl-madad:ro` to `nginx`'s volumes; confirmed present on the
   host and now correctly mounted.

**Lesson for future infra changes on this stack**: nothing here had been restarted in a long time
(`nginx` specifically had 27h uptime), so several unrelated pre-existing config gaps were latent and
only surfaced when `--force-recreate` actually exercised the full startup path for every service at
once. Before the next full-stack recreate, consider recreating one service at a time and checking
`docker ps`/`docker logs` after each, rather than all 6 in one shot.

## Context

Production runs 6 containers (`postgres`, `redis`, `api`, `web`, `admin`, `nginx`) on a single VPS
confirmed to have **4GB RAM, 2 vCPUs, 58GB disk** (checked directly on the production host: `free
-h` reports 3.8Gi total; `nproc` reports 2; `df -h /` reports 58G total, 15G used). None of the 6
services have a memory or CPU limit configured, and `redis` additionally has no `--maxmemory` cap
in production (unlike the dev compose file, which does set one) — on a host this size, one
container with a memory leak or an unbounded cache can exhaust all RAM and take down every other
service, including the database.

Separately, only 3 of the 6 services (`postgres`, `redis`, `api`) have a `healthcheck:` block —
`web`, `admin`, and `nginx` have none, so Compose can't detect a hung process in any of them, and
`depends_on: condition: service_healthy` (already used for `api`'s dependents) can't be extended to
gate on `web`/`admin` being genuinely ready either.

## Current state (verbatim, `docker-compose.prod.yml`, full file already read)

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: weelink
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: weelink_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U weelink -d weelink_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - internal
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    env_file: .env.prod
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - internal
      - proxy
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:4000/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    env_file: .env.prod
    depends_on:
      api:
        condition: service_healthy
    networks:
      - proxy
    restart: always

  admin:
    build:
      context: .
      dockerfile: Dockerfile.admin
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    env_file: .env.prod
    depends_on:
      api:
        condition: service_healthy
    networks:
      - proxy
    restart: always

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
      - admin
      - api
    networks:
      - proxy
    restart: always

networks:
  internal:
    driver: bridge
  proxy:
    driver: bridge

volumes:
  postgres_data:
    name: weelink_prod_postgres
  redis_data:
    name: weelink_prod_redis
```

Note: `api`'s healthcheck already correctly targets `/api/v1/health` — this endpoint now exists for
real (added in a prior audit plan, already deployed), so this healthcheck should already be passing
genuinely rather than by accident.

## What to do

### Step 1 — Add memory/CPU limits to every service

Compose v3's `deploy.resources.limits` key requires Swarm mode to enforce by default, but with
plain `docker compose up` (this project's actual deploy mechanism — confirmed no Swarm usage
anywhere) it is **not** enforced unless the Compose CLI is invoked with the appropriate mode, or
you use the older, universally-enforced `mem_limit`/`cpus` top-level keys instead. **Use
`mem_limit`/`cpus` directly on each service** (not `deploy.resources`), since that's what actually
takes effect under plain `docker compose up -d --force-recreate` — the exact command this project's
deploy process already uses.

Add to each service (sized against the confirmed 4GB RAM / 2 vCPU host, leaving headroom):

```yaml
  postgres:
    # ...existing config...
    mem_limit: 768m
    cpus: 1.0

  redis:
    # ...existing config...
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    mem_limit: 320m
    cpus: 0.5

  api:
    # ...existing config...
    mem_limit: 512m
    cpus: 1.0

  web:
    # ...existing config...
    mem_limit: 512m
    cpus: 0.75

  admin:
    # ...existing config...
    mem_limit: 384m
    cpus: 0.5

  nginx:
    # ...existing config...
    mem_limit: 128m
    cpus: 0.25
```

Note the `redis` command line now also gets `--maxmemory 256mb --maxmemory-policy allkeys-lru` —
production's redis currently has **no** memory cap at all (confirmed: unlike the dev compose file,
which already sets this), so it's the same missing-limit problem at the Redis-internal level, not
just the container level. This is a natural companion fix to the container `mem_limit`, not scope
creep — without it, Redis itself could try to grow past the container's memory ceiling and get
OOM-killed instead of evicting keys gracefully.

These numbers total roughly 2.6GB of worst-case simultaneous usage against 3.8GB available RAM,
leaving headroom for the OS and for build-time spikes (though builds happen locally in this
project's deploy process, not on the server, so server-side build memory pressure isn't a concern
here). If real-world usage patterns turn out tighter or looser than these estimates once observed,
they can be tuned later — treat these as a reasonable starting point, not a permanent exact science.

### Step 2 — Add healthchecks to `web`, `admin`, `nginx`

```yaml
  web:
    # ...existing config...
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  admin:
    # ...existing config...
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    # ...existing config...
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Verify `wget` is available inside the `nginx:alpine` and `node:22-alpine`-based images before
trusting this — `node:22-alpine` and `nginx:alpine` both include BusyBox, which provides a `wget`
applet by default, matching the pattern already proven working in `api`'s existing healthcheck; this
should work unchanged, but confirm via Verification Step 2 below rather than assuming.

### Step 3 (optional, small polish) — Gate `nginx` on real health, not just process-started

`nginx`'s `depends_on` currently lists `web`, `admin`, `api` with no `condition:`, meaning Compose
only waits for those containers to *start*, not to report healthy. Once Step 2 gives `web`/`admin`
real healthchecks, this can be tightened to match the pattern `api`'s dependents already use:
```yaml
  nginx:
    # ...
    depends_on:
      web:
        condition: service_healthy
      admin:
        condition: service_healthy
      api:
        condition: service_healthy
```
This is a nice-to-have, not required for the core finding — do it if convenient, skip it if you
want to keep this plan's blast radius minimal.

## Files in scope

- `docker-compose.prod.yml` (add `mem_limit`/`cpus` to all 6 services, `healthcheck:` to 3 of them,
  optionally tighten `nginx`'s `depends_on` conditions)

## Explicitly out of scope — do not touch

- Do not touch `docker-compose.yml` (local dev) — the hardcoded dev passwords and exposed
  `5433`/`6380` host ports in that file are separate, lower-severity, unselected findings from the
  same audit; this plan is production-compose-only.
- Do not change the `restart: always` policies, network topology, or volume definitions.
- Do not touch any Dockerfile — that's covered separately by plan 018.

## Verification

1. `docker compose -f docker-compose.prod.yml --env-file .env.prod config` on the production
   server — validates the YAML parses correctly and resolves env var interpolation without errors,
   before attempting to actually apply it.
2. `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate` (the
   project's standard restart command) and then `docker ps` — confirm all 6 containers reach
   `healthy` status within the configured `interval`×`retries` window (roughly 30-90s depending on
   the service), not stuck in `starting` or flipping to `unhealthy`.
3. `docker stats --no-stream` right after restart and again after the app has been running under
   normal traffic for a while — confirm no service is hovering near its new `mem_limit` ceiling
   (which would indicate the limit is too tight and needs raising) and that the host's overall free
   memory looks healthy.
4. Manually exercise the app end-to-end after this change (load the storefront, log into the
   dashboard, load the admin panel) — confirm nothing broke; this change should be purely
   operational/invisible to end users.
5. If any container gets OOM-killed after this change (`docker inspect <container> --format
   '{{.State.OOMKilled}}'` returns `true`, or `dmesg` shows an OOM kill), that specific service's
   `mem_limit` was set too low — raise it and re-verify, don't just remove the limit entirely.

## Maintenance note

If this project's traffic or feature set grows enough that these limits start getting hit under
normal (non-leak) load, that's a signal to either raise the specific service's limit (if the VPS
still has headroom) or upgrade the VPS itself — re-check `free -h`/`nproc` on the host before
deciding which, since these limits were sized against the specific 4GB/2vCPU host confirmed at the
time this plan was written, and that may no longer match if the server was ever resized.
