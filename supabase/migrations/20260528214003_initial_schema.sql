create extension if not exists pgcrypto;

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  country_code text not null default 'IS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_name text not null,
  birth_year integer,
  gender text,
  club_id uuid references public.clubs(id) on delete set null,
  country_code text not null default 'IS',
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_name, birth_year)
);

create table public.athlete_aliases (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source text,
  created_at timestamptz not null default now(),
  unique (normalized_alias, source)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  event_date date not null,
  region text,
  source text not null default 'hlaupadagskra',
  source_url text,
  import_status text not null default 'pending',
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_name, event_date)
);

create table public.races (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  distance_meters integer not null,
  category text,
  race_tier text not null default 'standard',
  timing_provider text not null default 'timataka',
  source_url text,
  import_status text not null default 'pending',
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name, distance_meters, category)
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

create table public.raw_results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  source_row_number integer,
  raw_name text not null,
  raw_club text,
  raw_rank text,
  raw_time text,
  raw_category text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (race_id, source_row_number)
);

create table public.cleaned_results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  raw_result_id uuid references public.raw_results(id) on delete set null,
  athlete_id uuid references public.athletes(id) on delete set null,
  rank_overall integer,
  rank_gender integer,
  rank_category integer,
  finish_time interval,
  finish_seconds numeric(10, 3),
  club_id uuid references public.clubs(id) on delete set null,
  category text,
  gender text,
  status text not null default 'finished',
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (race_id, athlete_id)
);

create table public.championship_scores (
  id uuid primary key default gen_random_uuid(),
  season integer not null,
  race_id uuid not null references public.races(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  cleaned_result_id uuid references public.cleaned_results(id) on delete set null,
  category text,
  race_tier text not null,
  placing_points numeric(8, 2) not null default 0,
  tier_multiplier numeric(6, 3) not null default 1,
  total_points numeric(8, 2) not null default 0,
  counts_for_standings boolean not null default true,
  created_at timestamptz not null default now(),
  unique (season, race_id, athlete_id, category)
);

create table public.elo_ratings (
  id uuid primary key default gen_random_uuid(),
  season integer not null,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  category text,
  rating numeric(8, 2) not null default 1500,
  races_count integer not null default 0,
  last_race_id uuid references public.races(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (season, athlete_id, category)
);

create table public.elo_history (
  id uuid primary key default gen_random_uuid(),
  elo_rating_id uuid not null references public.elo_ratings(id) on delete cascade,
  race_id uuid not null references public.races(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  rating_before numeric(8, 2) not null,
  rating_after numeric(8, 2) not null,
  rating_delta numeric(8, 2) not null,
  created_at timestamptz not null default now(),
  unique (race_id, athlete_id)
);

create index clubs_name_idx on public.clubs (name);
create index athletes_normalized_name_idx on public.athletes (normalized_name);
create index athletes_club_id_idx on public.athletes (club_id);
create index athlete_aliases_athlete_id_idx on public.athlete_aliases (athlete_id);
create index events_event_date_idx on public.events (event_date);
create index events_import_status_idx on public.events (import_status);
create index races_event_id_idx on public.races (event_id);
create index races_distance_category_idx on public.races (distance_meters, category);
create index races_import_status_idx on public.races (import_status);
create index raw_results_race_id_idx on public.raw_results (race_id);
create index cleaned_results_race_id_idx on public.cleaned_results (race_id);
create index cleaned_results_athlete_id_idx on public.cleaned_results (athlete_id);
create index championship_scores_season_category_idx on public.championship_scores (season, category);
create index championship_scores_athlete_id_idx on public.championship_scores (athlete_id);
create index elo_ratings_season_category_idx on public.elo_ratings (season, category);
create index elo_history_athlete_id_idx on public.elo_history (athlete_id);

alter table public.clubs enable row level security;
alter table public.athletes enable row level security;
alter table public.athlete_aliases enable row level security;
alter table public.events enable row level security;
alter table public.races enable row level security;
alter table public.import_batches enable row level security;
alter table public.raw_results enable row level security;
alter table public.cleaned_results enable row level security;
alter table public.championship_scores enable row level security;
alter table public.elo_ratings enable row level security;
alter table public.elo_history enable row level security;

create policy "Public read clubs" on public.clubs for select using (true);
create policy "Public read athletes" on public.athletes for select using (true);
create policy "Public read athlete aliases" on public.athlete_aliases for select using (true);
create policy "Public read events" on public.events for select using (true);
create policy "Public read races" on public.races for select using (true);
create policy "Public read cleaned results" on public.cleaned_results for select using (true);
create policy "Public read championship scores" on public.championship_scores for select using (true);
create policy "Public read elo ratings" on public.elo_ratings for select using (true);
create policy "Public read elo history" on public.elo_history for select using (true);

create policy "Service role writes clubs" on public.clubs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes athletes" on public.athletes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes athlete aliases" on public.athlete_aliases for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes events" on public.events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes races" on public.races for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes import batches" on public.import_batches for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes raw results" on public.raw_results for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes cleaned results" on public.cleaned_results for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes championship scores" on public.championship_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes elo ratings" on public.elo_ratings for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role writes elo history" on public.elo_history for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
