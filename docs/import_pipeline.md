# Import Pipeline

This document captures the V1 import workflow for race calendar metadata and Timataka race results.

## Sources

- `schedule_results.csv` is the V1 calendar seed.
- The CSV contains event metadata, race distance rows, rank/tier, championship flags, and Timataka result links when available.
- Timataka is the primary V1 results source.
- Corsa and Hlaupadagskrá automation are later work.

## Import Order

Run imports in this order:

```sh
supabase start
supabase migration up
npm run import:schedule -- --target local
npm run import:timataka:db -- --target local --race-id 13
```

For the linked hosted project, push schema first:

```sh
supabase db push
```

Then import hosted data explicitly:

```sh
SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." npm run import:schedule -- --target hosted
SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." npm run import:timataka:db -- --target hosted --race-id 13
```

## Targets And Secrets

Import scripts default to `--target local`.

- `--target local` reads local service credentials from `supabase status -o env`.
- `--target hosted` requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the shell environment.
- Import scripts intentionally do not read `.env.local` for service-role writes.
- Scripts print only target type and hostname, never keys.
- Hosted imports fail if the URL points to localhost. Local imports fail if the URL is not localhost.

## Current Verified Import

The first real race import is The Puffin Run:

```sh
npm run import:timataka:db -- --target local --race-id 13
```

Expected counts after local schedule + Puffin import:

- `events`: 98
- `races`: 188
- `athletes`: 425
- `athlete_aliases`: 425
- `raw_results`: 425
- `cleaned_results`: 425

The importer is idempotent for the verified Puffin path. Re-running the same schedule and Timataka imports should not increase those counts.

## Validation

Use these checks after import changes:

```sh
node --check scripts/import-utils.mjs
node --check scripts/import-schedule.mjs
node --check scripts/import-timataka-db.mjs
npm run lint
npm run data:validate
```

