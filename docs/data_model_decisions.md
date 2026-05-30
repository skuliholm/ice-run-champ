# Data Model Decisions

This document records V1 data decisions that should not depend on chat history.

## Calendar And Race Shape

- `events` represent a real-world event on a date, such as The Puffin Run.
- `races` represent a distance/category within an event.
- `schedule_results.csv` rows map to races; repeated CSV ids with different distances share one event.
- `source_event_id` and `source_race_id` make schedule imports idempotent.
- `distance_meters` is nullable because some races are duration-based, such as `15h` and `24h`.
- `distance_label` preserves the original CSV distance value.

## Results Shape

- `raw_results` stores the imported Timataka row and full raw payload.
- `cleaned_results` stores normalized result fields used by app logic.
- `import_batches` records each result import attempt.
- `import_status` on events/races tracks whether results are pending, available, or imported.

## Athlete Identity

- V1 athlete identity is `normalized_name + birth_year`.
- This matches current Timataka result data and keeps same-name athletes distinct.
- Athlete matching will need a more advanced review workflow later.

## Alias Identity

Aliases are not unique by name alone.

- `normalized_alias` stores the normalized display name.
- `source_provider` stores the provider, for example `timataka`.
- `source_key` stores the provider-specific disambiguator.
- Timataka uses `source_key = yob:<birthYear>`, for example `yob:1969`.
- `source_birth_year` stores the numeric birth year for querying.
- `source_payload` preserves lightweight matching metadata.
- The durable uniqueness rule is `normalized_alias + source_provider + source_key`.

This avoids collisions like two different athletes named `Ólafur Gylfason` in the same Timataka race.

## Access Policy

- Public read policies are enabled for public-facing data.
- Writes are service-role only.
- Service-role keys must never be committed.
- Import scripts require explicit hosted credentials in the shell and do not read `.env.local` for service-role writes.

