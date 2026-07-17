# 018 — Docker hardening: non-root user, pinned pnpm, fixed layer caching

Status: DONE (Steps 1-3 only) — Step 4 not attempted
Written against commit: `74e98a3`
Category: Docker | Impact: Medium | Effort: M | Risk of fix: Low (Steps 1-3) / Medium (Step 4, optional) | Confidence: High

## Execution note

Steps 1-3 (pin pnpm@11.9.0, fix layer-caching COPY order, add `USER node`) were applied to all
three Dockerfiles. **They could not be verified with a real `docker build`** — Docker Desktop
wasn't running locally and wouldn't start in a reasonable time during execution, and this
project's production server can't build (no outbound npm access, the whole reason this project's
deploy process never invokes `docker build` in the first place — deploys are `docker cp` +
`docker commit`, not image rebuilds). Verification was limited to: manually confirming every
`package.json` path referenced in the new COPY instructions actually exists at that path, and
static review of Dockerfile syntax. **Since these Dockerfiles are not part of the live deploy path,
this is lower-risk than it sounds — nothing today depends on them building correctly — but the
next time someone needs a from-scratch image rebuild (disaster recovery, a fresh server), build
each Dockerfile once with `docker build -f Dockerfile.api .` (etc.) before relying on it, and fix
forward if anything's wrong.** Step 4 (optional multi-stage split of `Dockerfile.api`) was skipped
entirely for the same reason — it's explicitly the riskier, harder-to-verify-blind change and the
plan's own escape hatch says to only attempt it once Steps 1-3 are confirmed working.

## Context

All three Dockerfiles (`Dockerfile.api`, `Dockerfile.web`, `Dockerfile.admin`, all at repo root)
share three fixable issues; `Dockerfile.api` additionally lacks the multi-stage split the other two
already correctly use.

## Current state (verbatim, all three files read in full)

`Dockerfile.api` (full file):
```dockerfile
FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY packages/config ./packages/config
COPY packages/db    ./packages/db
COPY apps/api       ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @weelink/db generate
RUN mkdir -p /app/apps/api/node_modules/.prisma && \
    cp -rf /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client \
           /app/apps/api/node_modules/.prisma/client
RUN pnpm --filter @weelink/api build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
```

`Dockerfile.web` and `Dockerfile.admin` are already correctly multi-stage (`builder` +
`production`, only `.next/standalone` + static + public copied into the final stage) — but both
still: copy full app source before `pnpm install` (busting the dependency-layer cache on every
source change), use `corepack prepare pnpm@latest` (unpinned), and have no `USER` directive in
either stage.

Root `package.json:22` (the pnpm version this project actually declares it uses elsewhere):
```json
  "packageManager": "pnpm@11.9.0",
```

None of the three Dockerfiles pin to this version — all use `pnpm@latest`, meaning a future
`docker build` could silently pick up a different pnpm major version than local development uses,
risking lockfile-resolution differences.

## Why this matters

- **Root user**: every container in this stack (`api`, `web`, `admin`) runs its Node process as
  root today. A code-execution vulnerability in any dependency becomes a root-in-container
  compromise instead of a constrained one — meaningfully worse blast radius for the same bug.
- **Unpinned pnpm**: non-reproducible builds — the same Dockerfile can produce different results
  weeks apart purely because `pnpm@latest` resolved to a different version, independent of any
  code change.
- **Busted layer cache**: full source is copied before `pnpm install` runs in all three files, so
  every build reinstalls all dependencies from scratch even when only application code changed —
  this doesn't affect the shipped image's correctness, only local build iteration speed (relevant
  since this project's entire deploy process is "build locally, then transfer" — a slow local build
  loop directly slows down every single deploy).

## What to do

### Step 1 — Pin the pnpm version (all three Dockerfiles)

In each of `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.admin`, replace:
```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
```
with:
```dockerfile
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
```
(matching the version already declared in root `package.json`'s `packageManager` field — don't
invent a different version).

### Step 2 — Fix dependency-layer caching (all three Dockerfiles)

The fix is to copy only the `package.json` files needed for `pnpm install --frozen-lockfile` to
resolve the workspace, install, and *only then* copy the rest of the source. pnpm needs each
workspace member's `package.json` present (not full source) to compute a correct install.

For `Dockerfile.api`, replace the `COPY`/`RUN pnpm install` block with:
```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY packages/config ./packages/config
COPY packages/db    ./packages/db
COPY apps/api       ./apps/api
```
Apply the identical pattern to `Dockerfile.web` (substituting `apps/web/package.json` /
`apps/web`) and `Dockerfile.admin` (substituting `apps/admin/package.json` / `apps/admin`) — copy
each workspace member's `package.json` alone first, install, then copy each member's full source.

This means source-only changes now only invalidate the layers from the second `COPY` onward — the
`pnpm install` layer stays cached across rebuilds where only application code changed, not
dependencies.

### Step 3 — Add a non-root user (all three Dockerfiles, final stage only for web/admin)

`node:22-alpine` ships a built-in `node` user (uid 1000) — no need to create one manually. Add
`USER node` after all build steps, immediately before `EXPOSE`/`CMD`, in:
- `Dockerfile.api` (single stage — add near the end, after the `RUN pnpm --filter @weelink/api
  build` line)
- `Dockerfile.web`'s **production** stage (after the three `COPY --from=builder` lines)
- `Dockerfile.admin`'s **production** stage (after the three `COPY --from=builder` lines)

Example for the end of `Dockerfile.api`:
```dockerfile
RUN pnpm --filter @weelink/api build

ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
```

**Escape hatch — file permissions**: files copied by `COPY` are owned by `root` by default (Alpine
default umask makes them world-readable, so the `node` user can typically still *read* and
*execute* them fine — this is the common case and usually needs no further change). If, after this
change, the container fails to start with an `EACCES`/permission-denied error (check via `docker
logs` after a test deploy), the fix is to add `--chown=node:node` to the relevant `COPY`
instructions rather than reverting to root — **do not revert to root as a shortcut to make a
permission error go away; fix the ownership instead, or STOP and report back if the fix isn't
obvious.**

**Escape hatch — uploads volume**: `apps/api`'s production container also writes to the
`UPLOAD_DIR` bind mount at runtime (new file uploads). If, after switching to the `node` user, file
uploads start failing with a permission error, the production host's bind-mounted uploads directory
needs its ownership changed to match uid 1000 (`chown -R 1000:1000 <uploads-dir-on-host>`) — this
is a production-host change, not a code change; **stop and report back before making this change
directly on the production server**, since it affects already-existing files.

### Step 4 (optional, higher risk — do only after Steps 1-3 are verified working) — Multi-stage split for `Dockerfile.api`

`Dockerfile.web`/`Dockerfile.admin` already ship only `.next/standalone` + static + public in their
final stage — `Dockerfile.api` ships the entire build environment (full `node_modules`, pnpm store,
TypeScript toolchain) because it's single-stage. Splitting it mirrors the same `builder` +
`production` pattern:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY packages/config ./packages/config
COPY packages/db    ./packages/db
COPY apps/api       ./apps/api

RUN pnpm --filter @weelink/db generate
RUN mkdir -p /app/apps/api/node_modules/.prisma && \
    cp -rf /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client \
           /app/apps/api/node_modules/.prisma/client
RUN pnpm --filter @weelink/api build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
```

**This step carries real risk and has a known project-specific gotcha**: this repo's own deploy
history (see `packages/db/prisma`-related deploy notes) explicitly documents that the Prisma query
engine binary is platform-specific, and that copying a *locally-generated* client into a container
breaks it. Copying between two `node:22-alpine` build stages in the *same* Dockerfile build (same
platform, same base image) should be safe since both stages share the same architecture/libc — but
this is exactly the kind of assumption that's cheap to get wrong. **Verify Step 4 extremely
carefully (see Verification below) before trusting it, and if the built image fails to start or
throws a Prisma "engine not found" error, STOP, do not debug-and-patch blindly — revert Step 4 only
(keep Steps 1-3) and report back.** Steps 1-3 stand on their own and don't require Step 4.

## Files in scope

- `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.admin` (all at repo root)

## Explicitly out of scope — do not touch

- Do not touch `docker-compose.yml` or `docker-compose.prod.yml` in this plan — resource limits and
  healthchecks for those files are covered separately by plan 019.
- Do not change the exposed ports, `ENV` values, or `CMD` entrypoints beyond what's shown above.
- Do not attempt Step 4 for `Dockerfile.web`/`Dockerfile.admin` — they're already correctly
  multi-stage; only `Dockerfile.api` needs this change.

## Verification

1. For each of the three Dockerfiles, after editing: build the image locally
   (`docker build -f Dockerfile.api -t weelink-api:test .` etc. — this requires Docker Desktop or
   equivalent locally; if unavailable, this verification must happen on the production server via a
   test build before committing to the real deploy) and confirm the build succeeds.
2. `docker run --rm weelink-api:test whoami` (or equivalent for web/admin) — expected output:
   `node`, confirming the process runs as non-root.
3. Start each test image with the same env vars the real container uses and confirm it boots
   cleanly (check logs for the same "Nest application successfully started" message the real
   deploys produce, or the Next.js "Ready in Xms" message) — no permission errors, no missing-module
   errors.
4. For `Dockerfile.api` specifically after Step 4: exercise at least one real Prisma-backed
   endpoint (e.g. `GET /api/v1/health`, which itself runs a real `SELECT 1` query per plan 004) —
   confirm it returns 200, not a 500 with a Prisma engine-resolution error in the logs.
5. Confirm image size actually decreased for `Dockerfile.api` after Step 4 (`docker images` —
   compare before/after) — this is the concrete signal Step 4 achieved its goal, not just that it
   didn't break anything.
6. Only after all of the above pass locally/in a test build: deploy for real following this
   project's established local-build-then-transfer process, and re-verify the live health endpoint
   and a real authenticated request (e.g. loading the dashboard) before considering this plan done.

## Maintenance note

Any future new Dockerfile added to this project (e.g. if `apps/mobile`'s eventual backend needs,
or a new microservice) should start from these patterns (pinned pnpm version, package.json-first
COPY ordering, non-root user) rather than copying the old `Dockerfile.api` pattern this plan
replaces.
