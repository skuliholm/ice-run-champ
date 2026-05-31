import { createClient } from "@supabase/supabase-js";

type SupabaseRaceRow = {
  id: string;
  source_race_id: string | null;
  name: string;
  distance_meters: number | null;
  distance_label: string | null;
  category: string | null;
  race_tier: string;
  race_type: string | null;
  timing_provider: string;
  source_url: string | null;
  import_status: string;
  is_icelandic_championship: boolean;
  events:
    | {
        name: string;
        event_date: string;
        source_url: string | null;
        import_status: string;
      }
    | Array<{
        name: string;
        event_date: string;
        source_url: string | null;
        import_status: string;
      }>;
};

type SupabaseResultRow = {
  rank_overall: number | null;
  rank_gender: number | null;
  finish_seconds: number | null;
  category: string | null;
  gender: string | null;
  raw_results:
    | {
        raw_payload: Record<string, unknown>;
      }
    | Array<{
        raw_payload: Record<string, unknown>;
      }>
    | null;
  athletes:
    | {
        full_name: string;
        birth_year: number | null;
      }
    | Array<{
        full_name: string;
        birth_year: number | null;
      }>
    | null;
  clubs:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

export type LiveRaceCard = {
  id: string;
  name: string;
  eventName: string;
  date: string;
  distanceMeters: number | null;
  distanceLabel: string | null;
  raceTier: string;
  raceType: string | null;
  provider: string;
  sourceUrl: string | null;
  importStatus: string;
  isIcelandicChampionship: boolean;
};

export type LiveRaceResult = {
  rankOverall: number | null;
  rankGender: number | null;
  bib: number | null;
  name: string;
  birthYear: number | null;
  club: string | null;
  genderCategory: string;
  time: string | null;
  chiptime: string | null;
  behind: string | null;
  finishSeconds: number | null;
};

export type LiveRaceDetail = LiveRaceCard & {
  results: LiveRaceResult[];
};

function publicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function firstValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getLiveRaceCalendar(): Promise<LiveRaceCard[]> {
  const supabase = publicSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("races")
    .select(
      "id, source_race_id, name, distance_meters, distance_label, category, race_tier, race_type, timing_provider, source_url, import_status, is_icelandic_championship, events(name, event_date, source_url, import_status)",
    );

  if (error || !data) return [];

  return (data as SupabaseRaceRow[])
    .map(mapRaceRow)
    .sort((a, b) => a.date.localeCompare(b.date) || a.eventName.localeCompare(b.eventName));
}

export async function getLiveRaceDetail(raceId: string): Promise<LiveRaceDetail | null> {
  const supabase = publicSupabase();
  if (!supabase) return null;

  const { data: raceRows, error: raceError } = await supabase
    .from("races")
    .select(
      "id, source_race_id, name, distance_meters, distance_label, category, race_tier, race_type, timing_provider, source_url, import_status, is_icelandic_championship, events(name, event_date, source_url, import_status)",
    )
    .eq("source_race_id", raceId)
    .limit(1);

  if (raceError || !raceRows?.length) return null;

  const race = mapRaceRow((raceRows as SupabaseRaceRow[])[0]);
  const { data: resultRows, error: resultError } = await supabase
    .from("cleaned_results")
    .select(
      "rank_overall, rank_gender, finish_seconds, category, gender, raw_results(raw_payload), athletes(full_name, birth_year), clubs(name)",
    )
    .eq("race_id", (raceRows as SupabaseRaceRow[])[0].id)
    .order("rank_overall", { ascending: true });

  if (resultError || !resultRows) return { ...race, results: [] };

  return {
    ...race,
    results: (resultRows as SupabaseResultRow[]).map(mapResultRow),
  };
}

function mapRaceRow(row: SupabaseRaceRow): LiveRaceCard {
  const event = firstValue(row.events);
  return {
    id: row.source_race_id ?? row.id,
    name: row.name,
    eventName: event?.name ?? row.name,
    date: event?.event_date ?? "",
    distanceMeters: row.distance_meters,
    distanceLabel: row.distance_label,
    raceTier: row.race_tier,
    raceType: row.race_type,
    provider: row.timing_provider,
    sourceUrl: row.source_url,
    importStatus: row.import_status,
    isIcelandicChampionship: row.is_icelandic_championship,
  };
}

function mapResultRow(row: SupabaseResultRow): LiveRaceResult {
  const raw = firstValue(row.raw_results)?.raw_payload ?? {};
  const athlete = firstValue(row.athletes);
  const club = firstValue(row.clubs);
  const finishSeconds = row.finish_seconds == null ? null : Number(row.finish_seconds);
  return {
    rankOverall: row.rank_overall,
    rankGender: row.rank_gender,
    bib: typeof raw.bib === "number" ? raw.bib : null,
    name: athlete?.full_name ?? (typeof raw.name === "string" ? raw.name : "Unknown athlete"),
    birthYear: athlete?.birth_year ?? null,
    club: club?.name ?? (typeof raw.club === "string" ? raw.club : null),
    genderCategory: row.gender ?? row.category ?? "unknown",
    time:
      typeof raw.time === "string" ? raw.time : finishSeconds == null ? null : formatSeconds(finishSeconds),
    chiptime: typeof raw.chiptime === "string" ? raw.chiptime : null,
    behind: typeof raw.behind === "string" ? raw.behind : null,
    finishSeconds,
  };
}

function formatSeconds(totalSeconds: number) {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
