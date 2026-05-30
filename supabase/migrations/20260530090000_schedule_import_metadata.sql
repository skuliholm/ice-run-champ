alter table public.events
  add column source_event_id text;

alter table public.races
  add column source_race_id text,
  add column race_type text,
  add column distance_label text,
  add column is_icelandic_championship boolean not null default false,
  alter column distance_meters drop not null;

alter table public.events
  add constraint events_source_source_event_id_key unique (source, source_event_id);

alter table public.races
  add constraint races_timing_provider_source_race_id_key unique (timing_provider, source_race_id);

create index events_source_event_id_idx on public.events (source_event_id);
create index races_source_race_id_idx on public.races (source_race_id);
create index races_race_type_idx on public.races (race_type);
create index races_is_icelandic_championship_idx on public.races (is_icelandic_championship);
