alter table public.athlete_aliases
  add column source_provider text not null default 'unknown',
  add column source_key text not null default 'unknown',
  add column source_birth_year integer,
  add column source_payload jsonb not null default '{}'::jsonb;

update public.athlete_aliases
set source_provider = coalesce(nullif(split_part(source, ':', 1), ''), 'unknown'),
    source_key = case
      when source like '%:%' then substring(source from position(':' in source) + 1)
      else coalesce(source, 'unknown')
    end,
    source_birth_year = case
      when source ~ ':(\d{4})$' then substring(source from ':(\d{4})$')::integer
      else null
    end,
    source_payload = jsonb_build_object('legacy_source', source)
where source_provider = 'unknown'
  and source_key = 'unknown';

alter table public.athlete_aliases
  drop constraint athlete_aliases_normalized_alias_source_key;

alter table public.athlete_aliases
  add constraint athlete_aliases_normalized_alias_provider_key unique (
    normalized_alias,
    source_provider,
    source_key
  );

create index athlete_aliases_source_provider_idx on public.athlete_aliases (source_provider);
create index athlete_aliases_source_birth_year_idx on public.athlete_aliases (source_birth_year);
