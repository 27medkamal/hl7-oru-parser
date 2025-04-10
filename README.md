# Everlab

## TODO:

- [ ] Polish this file
- [ ] Add tests

## Data Diagnosis:

### Queries run

```sql
SELECT name, COUNT(*) AS count FROM './prisma/data/diagnostic_metrics.csv' GROUP BY name HAVING COUNT(*) > 1;
SELECT * from './prisma/data/diagnostic_metrics.csv' where oru_sonic_units ilike '%;%';
```

### Analysis/Assumptions

#### DB

- `Total Serum IgA` is found as a duplicate. All fields are the same. Except `diagnostic` and `diagnostic_groups`, therefore need to give priority to metrics that have a `diagnostic` and `diagnostic_groups` field
- All units in `oru_sonic_units` for each metric are equivalent to `units`
- No metric has different units, but need to cater for the possibility
- Will go ahead with the assumption that if new units are to be used, new records will be added to `diagnostic_metrics.csv` where the metric name will be the same but the units will be different
- min_age and max_age are always whole numbers (integers)
- `diagnostic` and `group` have an m2m relationship
- `metric` has 1 `diagnostic` and therefore it is a 1:m relationship
- Can a `metric` have multiple conditions? As per the following, no. Therefore it's a 1:m relationship
  ```sql
  WITH all_pairs AS (SELECT name, TRIM(unnested.value) AS metric FROM read_csv_auto('prisma/data/conditions.csv'), UNNEST(string_split(diagnostic_metrics, ',')) AS unnested(value)) SELECT metric, COUNT(DISTINCT name) AS condition_count, LIST(name) AS conditions FROM all_pairs GROUP BY metric ORDER BY condition_count DESC;
  ```
- `conditions.csv` doesn't specify whether the condition is present if the metric value is above the maximum, or below the minimum. I will assume that the condition is present either way
- Possible issues (won't investigate, but should investigate in a production setting):
  - There is duplication of relationships which might introduce inconsistencies. Example: `diagnostic_groups.csv` has a `diagnostics` column. `diagnostics.csv` also has a `diagnostic_groups` column. There are many more examples of this. For this exercise, wherever there are multiple ways to traverse a relationship, I will choose one and ignore the rest. In a production setting though, data integrity should be ensured before loading such files.
- The `diagnostics.csv` file should have all the data that `diagnostic_groups.csv` and `diagnostics.csv` have:
  - It contains the `diagnostic_groups` and `diagnostic` columns with which you could derive the mapping between `diagnostic`, `group` and `metric`
  - This is <mark>ASSUMING</mark> perfect data integrity between the files. This should be verified in a production setting.
  - This is also due to the fact that the ORU file refers to metrics, therefore if there exists a group or diagnostic that doesn't have a metric, it is not relevant to the ORU file. Therefore, it is safe to ignore
  - From the above, it then follows that you need to only load `diagnostic_metrics.csv` and `conditions.csv` files, leading to:
    1. A simpler implementation
    1. Stronger data integrity guarantees
- assuming `group`, `diagnostic` and `condition` have unique names across the board
- min_age of 0 and max_age of 200 means they were not specified
- Not all metrics have a `condition` associated with them.
- Although the instructions specify that you should match on metric age range, gender oru_sonic_units and oru_sonic_codes, there only exists one metric with a `condition` associated with it.
- Assuming min_age, max_age, everlab_lower, everlab_higher, standard_lower and standard_higher are all inclusive
- Assuming if stardard_lower or everlab_lower is null or 0, that there is no lower limit

##### DB Graph

![DB Graph](prisma/db-graph.png)

### ORU Format

- The hl7 version used is 2.3 as can be seen inside the file
- Used the corresponding dictionary for the version from https://github.com/fernandojsg/hl7-dictionary
- To handle the oru file properly in a production settings, a lot more will have to be done:
  - Handling different versions
  - Reading different value types

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
