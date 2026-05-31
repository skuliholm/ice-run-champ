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
        id: string;
        full_name: string;
        birth_year: number | null;
      }
    | Array<{
        id: string;
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

type SupabaseStandingRow = {
  rank_gender: number | null;
  gender: string | null;
  athletes:
    | {
        id: string;
        full_name: string;
      }
    | Array<{
        id: string;
        full_name: string;
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
  races:
    | {
        source_race_id: string | null;
      }
    | Array<{
        source_race_id: string | null;
      }>
    | null;
};

type SupabaseAthleteRow = {
  id: string;
  full_name: string;
  birth_year: number | null;
  gender: string | null;
  country_code: string | null;
  clubs:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

type SupabaseAthleteResultRow = {
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
  clubs:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
  races:
    | {
        source_race_id: string | null;
        name: string;
        distance_meters: number | null;
        distance_label: string | null;
        race_tier: string;
        race_type: string | null;
        events:
          | {
              name: string;
              event_date: string;
            }
          | Array<{
              name: string;
              event_date: string;
            }>;
      }
    | Array<{
        source_race_id: string | null;
        name: string;
        distance_meters: number | null;
        distance_label: string | null;
        race_tier: string;
        race_type: string | null;
        events:
          | {
              name: string;
              event_date: string;
            }
          | Array<{
              name: string;
              event_date: string;
            }>;
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
  athleteId: string | null;
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

export type LiveStandingRow = {
  rank: number;
  athleteId: string;
  athleteName: string;
  club: string | null;
  totalPoints: number;
  racesCount: number;
  bestRank: number | null;
};

export type LiveAthleteRaceResult = {
  raceId: string;
  raceName: string;
  eventName: string;
  date: string;
  distanceMeters: number | null;
  distanceLabel: string | null;
  raceTier: string;
  raceType: string | null;
  rankOverall: number | null;
  rankGender: number | null;
  genderCategory: string;
  time: string | null;
  chiptime: string | null;
  behind: string | null;
  finishSeconds: number | null;
  club: string | null;
  points: number;
};

export type LiveAthleteDetail = {
  id: string;
  fullName: string;
  birthYear: number | null;
  gender: string | null;
  countryCode: string | null;
  club: string | null;
  totalPoints: number;
  racesCount: number;
  bestRank: number | null;
  results: LiveAthleteRaceResult[];
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
      "rank_overall, rank_gender, finish_seconds, category, gender, raw_results(raw_payload), athletes(id, full_name, birth_year), clubs(name)",
    )
    .eq("race_id", (raceRows as SupabaseRaceRow[])[0].id)
    .order("rank_overall", { ascending: true });

  if (resultError || !resultRows) return { ...race, results: [] };

  return {
    ...race,
    results: (resultRows as SupabaseResultRow[]).map(mapResultRow),
  };
}

export async function getLiveAthleteDetail(athleteId: string): Promise<LiveAthleteDetail | null> {
  const supabase = publicSupabase();
  if (!supabase) return null;

  const { data: athleteRows, error: athleteError } = await supabase
    .from("athletes")
    .select("id, full_name, birth_year, gender, country_code, clubs(name)")
    .eq("id", athleteId)
    .limit(1);

  if (athleteError || !athleteRows?.length) return null;

  const athlete = (athleteRows as SupabaseAthleteRow[])[0];
  const { data: resultRows, error: resultError } = await supabase
    .from("cleaned_results")
    .select(
      "rank_overall, rank_gender, finish_seconds, category, gender, raw_results(raw_payload), clubs(name), races(source_race_id, name, distance_meters, distance_label, race_tier, race_type, events(name, event_date))",
    )
    .eq("athlete_id", athlete.id)
    .order("rank_overall", { ascending: true });

  const results = resultError || !resultRows ? [] : (resultRows as SupabaseAthleteResultRow[]).map(mapAthleteResultRow);
  const totalPoints = results.reduce((sum, result) => sum + result.points, 0);
  const bestRank = results.reduce<number | null>((best, result) => {
    if (result.rankGender == null) return best;
    return best == null ? result.rankGender : Math.min(best, result.rankGender);
  }, null);
  const club = firstValue(athlete.clubs)?.name ?? results.find((result) => result.club)?.club ?? null;

  return {
    id: athlete.id,
    fullName: athlete.full_name,
    birthYear: athlete.birth_year,
    gender: athlete.gender,
    countryCode: athlete.country_code,
    club,
    totalPoints,
    racesCount: new Set(results.map((result) => result.raceId)).size,
    bestRank,
    results: results.sort((a, b) => b.date.localeCompare(a.date) || a.eventName.localeCompare(b.eventName)),
  };
}

export async function getLiveProvisionalStandings(): Promise<{
  men: LiveStandingRow[];
  women: LiveStandingRow[];
}> {
  const supabase = publicSupabase();
  if (!supabase) return { men: [], women: [] };

  const { data, error } = await supabase
    .from("cleaned_results")
    .select("rank_gender, gender, athletes(id, full_name), clubs(name), races(source_race_id)")
    .in("gender", ["m", "f"])
    .not("rank_gender", "is", null);

  if (error || !data) return { men: [], women: [] };

  const rows = data as SupabaseStandingRow[];
  return {
    men: buildStandings(rows.filter((row) => row.gender === "m")),
    women: buildStandings(rows.filter((row) => row.gender === "f")),
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
    athleteId: athlete?.id ?? null,
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

function mapAthleteResultRow(row: SupabaseAthleteResultRow): LiveAthleteRaceResult {
  const raw = firstValue(row.raw_results)?.raw_payload ?? {};
  const club = firstValue(row.clubs);
  const race = firstValue(row.races);
  const event = firstValue(race?.events);
  const finishSeconds = row.finish_seconds == null ? null : Number(row.finish_seconds);
  const rankGender = row.rank_gender;
  return {
    raceId: race?.source_race_id ?? "",
    raceName: race?.name ?? "Race",
    eventName: event?.name ?? race?.name ?? "Race",
    date: event?.event_date ?? "",
    distanceMeters: race?.distance_meters ?? null,
    distanceLabel: race?.distance_label ?? null,
    raceTier: race?.race_tier ?? "standard",
    raceType: race?.race_type ?? null,
    rankOverall: row.rank_overall,
    rankGender,
    genderCategory: row.gender ?? row.category ?? "unknown",
    time:
      typeof raw.time === "string" ? raw.time : finishSeconds == null ? null : formatSeconds(finishSeconds),
    chiptime: typeof raw.chiptime === "string" ? raw.chiptime : null,
    behind: typeof raw.behind === "string" ? raw.behind : null,
    finishSeconds,
    club: club?.name ?? (typeof raw.club === "string" ? raw.club : null),
    points: rankGender == null ? 0 : Math.max(0, 101 - rankGender),
  };
}

function buildStandings(rows: SupabaseStandingRow[]) {
  const byAthlete = new Map<
    string,
    {
      athleteId: string;
      athleteName: string;
      club: string | null;
      totalPoints: number;
      raceIds: Set<string>;
      bestRank: number | null;
    }
  >();

  for (const row of rows) {
    const athlete = firstValue(row.athletes);
    if (!athlete || row.rank_gender == null) continue;
    const club = firstValue(row.clubs);
    const race = firstValue(row.races);
    const current =
      byAthlete.get(athlete.id) ??
      {
        athleteId: athlete.id,
        athleteName: athlete.full_name,
        club: club?.name ?? null,
        totalPoints: 0,
        raceIds: new Set<string>(),
        bestRank: null,
      };

    current.totalPoints += Math.max(0, 101 - row.rank_gender);
    if (race?.source_race_id) current.raceIds.add(race.source_race_id);
    current.bestRank = current.bestRank == null ? row.rank_gender : Math.min(current.bestRank, row.rank_gender);
    if (!current.club && club?.name) current.club = club.name;
    byAthlete.set(athlete.id, current);
  }

  return [...byAthlete.values()]
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.raceIds.size - a.raceIds.size ||
        (a.bestRank ?? Number.POSITIVE_INFINITY) - (b.bestRank ?? Number.POSITIVE_INFINITY) ||
        a.athleteName.localeCompare(b.athleteName),
    )
    .map((row, index) => ({
      rank: index + 1,
      athleteId: row.athleteId,
      athleteName: row.athleteName,
      club: row.club,
      totalPoints: row.totalPoints,
      racesCount: row.raceIds.size,
      bestRank: row.bestRank,
    }));
}

function formatSeconds(totalSeconds: number) {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
