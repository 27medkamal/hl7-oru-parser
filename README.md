# Everlab

## Data Diagnosis:

### Queries run

```sql
SELECT name, COUNT(*) AS count FROM './prisma/data/diagnostic_metrics.csv' GROUP BY name HAVING COUNT(*) > 1;
SELECT * from './prisma/data/diagnostic_metrics.csv' where oru_sonic_units ilike '%;%';
```

### Analysis/Assumptions

- `Total Serum IgA` is found as a duplicate. All fields are the same. Except `diagnostic` and `diagnostic_groups`, therefore need to give priority to metrics that have a `diagnostic` and `diagnostic_groups` field
- All units in `oru_sonic_units` for each metric are equivalent to `units`
- No metric has different units, but need to cater for the possibility
- Will go ahead with the assumption that if new units are to be used, new records will be added to `diagnostic_metrics.csv` where the metric name will be the same but the units will be different
- min_age and max_age are always whole numbers (integers)
- `diagnostic` and `group` have an m2m relationship
- `metric` has 1 `diagnostic` and therefore it is a 1:m relationship
- Can a `metric` have multiple conditions? As per the following, no. Therefore it's a 1:m relationship
  ````sql
  WITH all_pairs AS (SELECT name, TRIM(unnested.value) AS metric FROM read_csv_auto('prisma/data/conditions.csv'), UNNEST(string_split(diagnostic_metrics, ',')) AS unnested(value)) SELECT metric, COUNT(DISTINCT name) AS condition_count, LIST(name) AS conditions FROM all_pairs GROUP BY metric ORDER BY condition_count DESC;
  ````
- `conditions.csv` doesn't specify whether the condition is present if the metric value is above the maximum, or below the minimum. I will assume that the condition is present either way
- Possible issues (won't investigate, but should investigate in a production setting):
  - There is duplication of relationships which might introduce inconsistencies. Example: `diagnostic_groups.csv` has a `diagnostics` column. `diagnostics.csv` also has a `diagnostic_groups` column. There are many more examples of this. For this exercise, wherever there are multiple ways to traverse a relationship, I will choose one and ignore the rest. In a production setting though, data integrity should be ensured before loading such files.
- assuming `group`, `diagnostic` and `condition` have unique names across the board
- TODO: db graph

## Features

- 🧙‍♂️ E2E typesafety with [tRPC](https://trpc.io)
- ⚡ Full-stack React with Next.js
- ⚡ Database with Prisma
- ⚙️ VSCode extensions
- 🎨 ESLint + Prettier
- 💚 CI setup using GitHub Actions:
  - ✅ E2E testing with [Playwright](https://playwright.dev/)
  - ✅ Linting
- 🔐 Validates your env vars on build and start

## Setup

```bash
pnpm create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
pnpm
pnpm dx
```

### Requirements

- Node >= 18.0.0
- Postgres

## Development

### Start project

```bash
pnpm create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
pnpm
pnpm dx
```

### Commands

```bash
pnpm build      # runs `prisma generate` + `prisma migrate` + `next build`
pnpm db-reset   # resets local db
pnpm dev        # starts next.js
pnpm dx         # starts postgres db + runs migrations + seeds + starts next.js
pnpm test-dev   # runs e2e tests on dev
pnpm test-start # runs e2e + unit tests
pnpm test-unit  # runs normal Vitest unit tests
pnpm test-e2e   # runs e2e tests
```

## Deployment

### Using [Render](https://render.com/)

The project contains a [`render.yaml`](./render.yaml) [_"Blueprint"_](https://render.com/docs/blueprint-spec) which makes the project easily deployable on [Render](https://render.com/).

Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) and connect to this Blueprint and see how the app and database automatically gets deployed.

## Files of note

<table>
  <thead>
    <tr>
      <th>Path</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="./prisma/schema.prisma"><code>./prisma/schema.prisma</code></a></td>
      <td>Prisma schema</td>
    </tr>
    <tr>
      <td><a href="./src/pages/api/trpc/[trpc].ts"><code>./src/pages/api/trpc/[trpc].ts</code></a></td>
      <td>tRPC response handler</td>
    </tr>
    <tr>
      <td><a href="./src/server/routers"><code>./src/server/routers</code></a></td>
      <td>Your app's different tRPC-routers</td>
    </tr>
  </tbody>
</table>

---

Created by [@alexdotjs](https://twitter.com/alexdotjs).
