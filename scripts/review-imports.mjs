import { createServiceClient, parseArgs, throwIfSupabaseError } from "./import-utils.mjs";
import { loadImportCorrections } from "./import-corrections.mjs";

const COUNT_TABLES = [
  "events",
  "races",
  "athletes",
  "athlete_aliases",
  "import_batches",
  "raw_results",
  "cleaned_results",
];

async function tableCount(supabase, table) {
  const result = await supabase.from(table).select("*", { count: "exact", head: true });
  if (result.error) throw new Error(`Failed to count ${table}: ${result.error.message}`);
  return result.count ?? 0;
}

async function raceResultCount(supabase, table, raceId) {
  const result = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("race_id", raceId);
  if (result.error) throw new Error(`Failed to count ${table}: ${result.error.message}`);
  return result.count ?? 0;
}

function duplicateNameBirthYearGroups(athletes) {
  const yearsByName = new Map();
  for (const athlete of athletes) {
    const years = yearsByName.get(athlete.normalized_name) ?? new Set();
    years.add(athlete.birth_year ?? "unknown");
    yearsByName.set(athlete.normalized_name, years);
  }

  return [...yearsByName.entries()]
    .filter(([, years]) => years.size > 1)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .slice(0, 20);
}

function duplicateAliasGroups(aliases) {
  const keysByAlias = new Map();
  for (const alias of aliases) {
    const keys = keysByAlias.get(alias.normalized_alias) ?? new Set();
    keys.add(`${alias.source_provider}:${alias.source_key}`);
    keysByAlias.set(alias.normalized_alias, keys);
  }

  return [...keysByAlias.entries()]
    .filter(([, keys]) => keys.size > 1)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .slice(0, 20);
}

async function main() {
  const args = parseArgs();
  const supabase = createServiceClient({ target: args.target ?? "local" });
  const corrections = await loadImportCorrections();

  console.log("Table counts:");
  for (const table of COUNT_TABLES) {
    console.log(`- ${table}: ${await tableCount(supabase, table)}`);
  }

  const importedRaces = throwIfSupabaseError(
    await supabase
      .from("races")
      .select("id, source_race_id, name, import_status")
      .eq("timing_provider", "timataka")
      .eq("import_status", "imported")
      .order("source_race_id", { ascending: true }),
    "Failed to fetch imported races",
  );

  console.log("\nImported Timataka races:");
  if (importedRaces.length === 0) {
    console.log("- none");
  }
  for (const race of importedRaces) {
    const rawCount = await raceResultCount(supabase, "raw_results", race.id);
    const cleanedCount = await raceResultCount(supabase, "cleaned_results", race.id);
    const mismatch = rawCount === cleanedCount ? "" : " [raw/cleaned mismatch]";
    console.log(
      `- ${race.source_race_id}: ${race.name} (${rawCount} raw, ${cleanedCount} cleaned)${mismatch}`,
    );
  }

  const unknownGenderResult = await supabase
    .from("cleaned_results")
    .select("*", { count: "exact", head: true })
    .or("gender.is.null,gender.eq.unknown");
  if (unknownGenderResult.error) {
    throw new Error(`Failed to count unknown gender rows: ${unknownGenderResult.error.message}`);
  }
  const unknownGenderCount = unknownGenderResult.count ?? 0;
  console.log(`\nCleaned results with unknown gender: ${unknownGenderCount}`);
  if (unknownGenderCount > 0) {
    const unknownRows = throwIfSupabaseError(
      await supabase
        .from("cleaned_results")
        .select("rank_overall, athletes(full_name, birth_year), races(source_race_id, name)")
        .or("gender.is.null,gender.eq.unknown")
        .order("rank_overall", { ascending: true })
        .limit(10),
      "Failed to fetch unknown gender rows",
    );
    for (const row of unknownRows) {
      const athlete = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes;
      const race = Array.isArray(row.races) ? row.races[0] : row.races;
      console.log(
        `- ${race?.source_race_id ?? "unknown race"} #${row.rank_overall ?? "-"}: ${
          athlete?.full_name ?? "Unknown athlete"
        } (${athlete?.birth_year ?? "unknown"})`,
      );
    }
  }

  console.log(`\nConfigured Timataka corrections: ${(corrections.timataka ?? []).length}`);
  for (const correction of corrections.timataka ?? []) {
    console.log(
      `- ${correction.sourceRaceId}: ${correction.normalizedName} (${correction.birthYear ?? "unknown"}) -> ${correction.genderCategory}`,
    );
  }

  const athletes = throwIfSupabaseError(
    await supabase.from("athletes").select("normalized_name, birth_year").order("normalized_name"),
    "Failed to fetch athletes",
  );
  const nameGroups = duplicateNameBirthYearGroups(athletes);
  console.log("\nNames with multiple birth years:");
  if (nameGroups.length === 0) {
    console.log("- none");
  }
  for (const [name, years] of nameGroups) {
    console.log(`- ${name}: ${[...years].join(", ")}`);
  }

  const aliases = throwIfSupabaseError(
    await supabase
      .from("athlete_aliases")
      .select("normalized_alias, source_provider, source_key")
      .order("normalized_alias"),
    "Failed to fetch athlete aliases",
  );
  const aliasGroups = duplicateAliasGroups(aliases);
  console.log("\nAliases with multiple provider keys:");
  if (aliasGroups.length === 0) {
    console.log("- none");
  }
  for (const [alias, keys] of aliasGroups) {
    console.log(`- ${alias}: ${[...keys].join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
