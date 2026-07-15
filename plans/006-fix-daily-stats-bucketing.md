# 006 — Fix broken daily analytics bucketing (groupBy on full timestamp)

Status: TODO
Written against commit: `6afe742`
Category: Performance / Correctness | Impact: Medium-High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/api/src/analytics/analytics.service.ts` powers the shop-owner analytics dashboard
(`GET /analytics/dashboard?days=30`, called from `apps/web/src/app/dashboard`). Its private
`getDailyStats` helper is meant to return one data point per day (for a line chart of page views
over the selected window), but the Prisma `groupBy` call groups by the full `createdAt` timestamp
column (down to the millisecond), not by calendar day.

## Current state (verbatim, `apps/api/src/analytics/analytics.service.ts:63-88`)

```ts
  private async getDailyStats(shopId: string, since: Date, event: string) {
    const rows = await this.prisma.analytics.groupBy({
      by: ["createdAt"],
      where: { shopId, event, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    // Bucket into days
    const buckets: Record<string, number> = {};
    const now = new Date();
    const days = Math.ceil((now.getTime() - since.getTime()) / 86400000);

    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }

    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + row._count.id;
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }
```

The `Analytics` model (`packages/db/prisma/schema.prisma:279-294`, no `@@map`, so the table name
is `"Analytics"`):
```prisma
model Analytics {
  id        String   @id @default(uuid())
  shopId    String
  event     String
  data      Json?
  ip        String?
  userAgent String?
  referer   String?
  country   String?
  city      String?
  createdAt DateTime @default(now())

  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)

  @@index([shopId, event])
  @@index([shopId, createdAt])
}
```

## Why this matters

`groupBy(by: ["createdAt"])` groups by the exact, millisecond-precision timestamp — since real
page-view events almost never share the exact same millisecond, this returns approximately **one
group per row** instead of ~`days` daily aggregates. For a shop with thousands of page views in
the selected window, this pulls back thousands of near-useless single-row groups from Postgres,
which the JS loop below then re-buckets by truncating each timestamp to a day string anyway — the
final *output* is correct (the JS loop does the right day-level aggregation), but the query does
all the real aggregation work in application code after transferring every single row, instead of
letting Postgres do it. This scales linearly with total raw event count instead of with the number
of days in the window, and is the most-invoked N+1-shaped inefficiency an audit found: this method
runs on every single analytics-dashboard page load.

## What to do

Replace the `groupBy`-on-full-timestamp with a raw SQL query that truncates to day *in Postgres*,
so the database does the aggregation and only ~`days` rows are ever transferred.

Edit `apps/api/src/analytics/analytics.service.ts`, replacing the `getDailyStats` method body:

```ts
  private async getDailyStats(shopId: string, since: Date, event: string) {
    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "Analytics"
      WHERE "shopId" = ${shopId} AND event = ${event} AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Bucket into days (fills gaps with 0 for days with no events)
    const buckets: Record<string, number> = {};
    const now = new Date();
    const days = Math.ceil((now.getTime() - since.getTime()) / 86400000);

    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }

    for (const row of rows) {
      const key = row.day.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + Number(row.count);
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }
```

Notes on this specific rewrite:
- `$queryRaw` with tagged-template interpolation (the `${shopId}` etc. syntax) is Prisma's
  parameterized-query form — it is **not** string concatenation and is not SQL-injectable; this is
  the standard safe way to use `$queryRaw` in Prisma and matches how you'd want any future raw
  query in this codebase written. Do not switch to `$queryRawUnsafe` or manual string building.
- `COUNT(*)::bigint` returns a JS `bigint` via `pg`/Prisma — hence `Number(row.count)` when
  accumulating into `buckets`, otherwise you'd get a `TypeError` mixing `bigint` and `number`, or a
  string depending on the driver's raw-query row shape. Confirm the actual returned type by running
  Step 1 of Verification below rather than assuming — if the driver returns `count` as a `string`
  instead of `bigint`, `Number(row.count)` still works correctly either way, so the code above is
  safe regardless of which one Prisma's raw-query result actually gives you.
- The gap-filling loop (days with zero events) is preserved unchanged from the original — only the
  data-fetching query changed, not the output shape. The function's return type/shape must stay
  identical (`{ date: string, count: number }[]`) since `apps/web/src/app/dashboard`'s chart
  component consumes it as-is.

## Files in scope

- `apps/api/src/analytics/analytics.service.ts` (the `getDailyStats` method only)

## Explicitly out of scope — do not touch

- `getDashboard` (the public method calling `getDailyStats`) — no changes needed there, it already
  calls `this.getDailyStats(shopId, since, "PAGE_VIEW")` correctly; don't touch its `Promise.all`
  or the other four parallel queries alongside it.
- Do not change the `Analytics` Prisma model or its indexes in `schema.prisma`.
- Do not add a new index for this query — `@@index([shopId, createdAt])` (schema.prisma:294)
  already covers `WHERE shopId = ? AND createdAt >= ?` efficiently; `event` isn't in that
  composite index but is combined with `shopId` in a separate index (`@@index([shopId, event])`,
  line 293) — Postgres's planner can use either depending on selectivity. If `EXPLAIN ANALYZE` in
  Verification Step 3 shows a sequential scan instead of an index scan, report that back rather
  than adding a new index yourself — index changes should go through the normal manual-SQL
  production-deploy process this project uses (see plan 003's context on migrations), not be
  silently bundled into this performance fix.

## Verification

1. `pnpm --filter @weelink/api build` — must compile with no TypeScript errors (pay attention to
   the `$queryRaw` generic type argument matching the actual selected columns).
2. Seed or use existing local dev data with multiple `Analytics` rows (`event = "PAGE_VIEW"`)
   spread across at least 3 different days for one shop. Call `GET /analytics/dashboard?days=30`
   (authenticated as that shop's owner) and inspect the `dailyViews` field in the response.
   Expected: one entry per day in the 30-day window, `count` matching the real number of
   `PAGE_VIEW` events that day (cross-check with a manual `SELECT COUNT(*) FROM "Analytics" WHERE
   "shopId" = '...' AND event = 'PAGE_VIEW' AND "createdAt"::date = '2026-...'` for a couple of
   spot-check days).
3. `EXPLAIN ANALYZE` the raw query directly against the dev database (substitute real values) to
   confirm it uses an index scan, not a sequential scan, and that the row count returned by
   Postgres is on the order of `days` (~30), not the raw event count.
4. Compare dashboard chart rendering before/after in the browser (`apps/web/src/app/dashboard`) —
   the visual output (line chart shape) must be identical to before this change; only the query
   efficiency changed, not the data.

## Maintenance note

If a future feature needs sub-day granularity (e.g. hourly stats for a "today" view), don't reuse
this method with a different truncation unit inline — add a separate method with an explicit
`date_trunc('hour', ...)` call, since callers currently assume `dailyViews` entries are one-per-day.
