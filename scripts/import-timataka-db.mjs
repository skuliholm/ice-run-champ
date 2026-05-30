import {
  createServiceClient,
  parseArgs,
  throwIfSupabaseError,
} from "./import-utils.mjs";
import { parseTimatakaResults, timatakaCategoryUrl } from "./timataka-parser.mjs";

async function fetchCategory(sourceUrl, category, metadata) {
  const categoryUrl = timatakaCategoryUrl(sourceUrl, category);
  const response = await fetch(categoryUrl, {
    headers: {
      "user-agent": "ice-run-champ/0.1 (+https://github.com/) timataka-db-import",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${categoryUrl}: ${response.status} ${response.statusText}`);
  }

  return parseTimatakaResults(await response.text(), categoryUrl, category, metadata);
}

async function main() {
  const args = parseArgs();
  const scheduleRaceId = args["source-race-id"] ?? (args["race-id"] ? `schedule-2026-${args["race-id"]}` : null);
  if (!scheduleRaceId) {
    throw new Error("Provide --race-id 13 or --source-race-id schedule-2026-13-20-overall.");
  }

  const supabase = await createServiceClient();
  const race = await findRace(supabase, scheduleRaceId);
  if (!race.source_url) {
    throw new Error(`Race ${race.source_race_id} does not have a Timataka result URL.`);
  }

  const metadata = {
    event: {
      id: race.event.source_event_id,
      name: race.event.name,
      date: race.event.event_date,
      source: "timataka",
      sourceUrl: race.source_url,
      importStatus: "imported",
    },
    race: {
      id: race.source_race_id,
      name: race.name,
      distanceMeters: race.distance_meters,
      category: race.category,
      raceTier: race.race_tier,
      timingProvider: race.timing_provider,
      importStatus: "imported",
    },
  };

  let batchId = null;
  try {
    const batch = throwIfSupabaseError(
      await supabase
        .from("import_batches")
        .insert({
          source: "timataka",
          source_url: race.source_url,
          status: "running",
          notes: `Import ${race.source_race_id}`,
        })
        .select("id")
        .single(),
      "Failed to create import batch",
    );
    batchId = batch.id;

    const overall = await fetchCategory(race.source_url, race.category || "overall", metadata);
    const male = await fetchCategory(race.source_url, "m", metadata);
    const female = await fetchCategory(race.source_url, "f", metadata);
    const results = mergeGenderResults(overall.results, male.results, female.results);

    const clubIdByName = await upsertClubs(supabase, results);
    const athleteIdByKey = await upsertAthletes(supabase, results, clubIdByName);
    const rawIdByRow = await upsertRawResults(supabase, race.id, batchId, results);
    await upsertCleanedResults(supabase, race.id, results, athleteIdByKey, clubIdByName, rawIdByRow);

    throwIfSupabaseError(
      await supabase
        .from("races")
        .update({ import_status: "imported" })
        .eq("id", race.id),
      "Failed to mark race imported",
    );
    throwIfSupabaseError(
      await supabase
        .from("events")
        .update({ import_status: "imported", source_url: race.source_url })
        .eq("id", race.event_id),
      "Failed to mark event imported",
    );
    throwIfSupabaseError(
      await supabase
        .from("import_batches")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          notes: `Imported ${results.length} finishers for ${race.source_race_id}`,
        })
        .eq("id", batchId),
      "Failed to complete import batch",
    );

    console.log(
      `Imported ${results.length} Timataka finishers into Supabase for ${race.name} (${race.source_race_id}).`,
    );
  } catch (error) {
    if (batchId) {
      await supabase
        .from("import_batches")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          notes: error.message,
        })
        .eq("id", batchId);
    }
    throw error;
  }
}

async function findRace(supabase, scheduleRaceId) {
  let query = supabase
    .from("races")
    .select("*, event:events(*)")
    .eq("timing_provider", "timataka");

  if (scheduleRaceId.startsWith("schedule-2026-") && scheduleRaceId.split("-").length > 3) {
    query = query.eq("source_race_id", scheduleRaceId);
  } else {
    query = query
      .like("source_race_id", `${scheduleRaceId}-%`)
      .not("source_url", "is", null)
      .limit(1);
  }

  const rows = throwIfSupabaseError(await query, "Failed to find scheduled race");
  const race = Array.isArray(rows) ? rows[0] : rows;
  if (!race) {
    throw new Error(
      `Could not find ${scheduleRaceId}. Run \`npm run import:schedule\` before importing results.`,
    );
  }
  return race;
}

function mergeGenderResults(overallResults, maleResults, femaleResults) {
  const genderByAthlete = new Map();
  for (const result of maleResults) {
    genderByAthlete.set(result.athleteId, { genderCategory: "m", rankGender: result.rankOverall });
  }
  for (const result of femaleResults) {
    genderByAthlete.set(result.athleteId, { genderCategory: "f", rankGender: result.rankOverall });
  }
  return overallResults.map((result) => ({
    ...result,
    ...(genderByAthlete.get(result.athleteId) ?? {
      genderCategory: "unknown",
      rankGender: null,
    }),
  }));
}

async function upsertClubs(supabase, results) {
  const names = [...new Set(results.map((result) => result.club).filter(Boolean))];
  if (names.length === 0) return new Map();
  const clubs = throwIfSupabaseError(
    await supabase
      .from("clubs")
      .upsert(names.map((name) => ({ name })), { onConflict: "name" })
      .select("id, name"),
    "Failed to upsert clubs",
  );
  return new Map(clubs.map((club) => [club.name, club.id]));
}

async function upsertAthletes(supabase, results, clubIdByName) {
  const byKey = new Map();
  for (const result of results) {
    if (!byKey.has(result.athleteId)) byKey.set(result.athleteId, result);
  }

  const athletes = [...byKey.values()].map((result) => ({
    full_name: result.name,
    normalized_name: result.normalizedName,
    birth_year: result.birthYear,
    gender: result.genderCategory === "unknown" ? null : result.genderCategory,
    club_id: result.club ? clubIdByName.get(result.club) : null,
    country_code: "IS",
    is_mock: false,
  }));

  const upserted = throwIfSupabaseError(
    await supabase
      .from("athletes")
      .upsert(athletes, { onConflict: "normalized_name,birth_year" })
      .select("id, normalized_name, birth_year"),
    "Failed to upsert athletes",
  );

  const idByKey = new Map(
    upserted.map((athlete) => [`${athlete.normalized_name}-${athlete.birth_year ?? "unknown"}`, athlete.id]),
  );

  const aliasesByKey = new Map();
  for (const result of byKey.values()) {
    const athleteId = idByKey.get(`${result.normalizedName}-${result.birthYear ?? "unknown"}`);
    if (!athleteId) continue;
    const sourceProvider = "timataka";
    const sourceKey = `yob:${result.birthYear ?? "unknown"}`;
    aliasesByKey.set(`${result.normalizedName}|${sourceProvider}|${sourceKey}`, {
      athlete_id: athleteId,
      alias: result.name,
      normalized_alias: result.normalizedName,
      source: sourceProvider,
      source_provider: sourceProvider,
      source_key: sourceKey,
      source_birth_year: result.birthYear,
      source_payload: {
        provider: sourceProvider,
        strategy: "yob",
      },
    });
  }
  const aliases = [...aliasesByKey.values()];

  if (aliases.length > 0) {
    throwIfSupabaseError(
      await supabase.from("athlete_aliases").upsert(aliases, {
        onConflict: "normalized_alias,source_provider,source_key",
      }),
      "Failed to upsert athlete aliases",
    );
  }

  return idByKey;
}

async function upsertRawResults(supabase, raceId, batchId, results) {
  const rows = results.map((result, index) => ({
    race_id: raceId,
    import_batch_id: batchId,
    source_row_number: index + 1,
    raw_name: result.name,
    raw_club: result.club,
    raw_rank: String(result.rankOverall),
    raw_time: result.chiptime ?? result.time,
    raw_category: result.genderCategory,
    raw_payload: result,
  }));

  const upserted = throwIfSupabaseError(
    await supabase
      .from("raw_results")
      .upsert(rows, { onConflict: "race_id,source_row_number" })
      .select("id, source_row_number"),
    "Failed to upsert raw results",
  );
  return new Map(upserted.map((row) => [row.source_row_number, row.id]));
}

async function upsertCleanedResults(supabase, raceId, results, athleteIdByKey, clubIdByName, rawIdByRow) {
  const rows = results
    .map((result, index) => {
      const athleteId = athleteIdByKey.get(`${result.normalizedName}-${result.birthYear ?? "unknown"}`);
      if (!athleteId) return null;
      return {
        race_id: raceId,
        raw_result_id: rawIdByRow.get(index + 1),
        athlete_id: athleteId,
        rank_overall: result.rankOverall,
        rank_gender: result.rankGender,
        rank_category: null,
        finish_time: result.finishSeconds == null ? null : `${result.finishSeconds} seconds`,
        finish_seconds: result.finishSeconds,
        club_id: result.club ? clubIdByName.get(result.club) : null,
        category: result.genderCategory,
        gender: result.genderCategory === "unknown" ? null : result.genderCategory,
        status: "finished",
        is_mock: false,
      };
    })
    .filter(Boolean);

  throwIfSupabaseError(
    await supabase.from("cleaned_results").upsert(rows, { onConflict: "race_id,athlete_id" }),
    "Failed to upsert cleaned results",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
