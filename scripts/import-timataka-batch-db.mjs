import { createServiceClient, parseArgs, throwIfSupabaseError } from "./import-utils.mjs";
import { findRace, importRaceResults } from "./import-timataka-db.mjs";

// Operational notes and safety rules live in docs/import_pipeline.md.
function parsePositiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

function sourceRaceIdFromArgs(args) {
  if (args["source-race-id"]) return args["source-race-id"];
  if (args["race-id"]) return `schedule-2026-${args["race-id"]}`;
  return null;
}

async function findCandidateRaces(supabase, args) {
  const sourceRaceId = sourceRaceIdFromArgs(args);
  if (sourceRaceId) return [await findRace(supabase, sourceRaceId)];

  let query = supabase
    .from("races")
    .select("*, event:events(*)")
    .eq("timing_provider", "timataka")
    .not("source_url", "is", null)
    .order("source_race_id", { ascending: true });

  if (!args["include-imported"]) {
    query = query.eq("import_status", "results_available");
  }

  if (!args.all) {
    const limit = args.limit ? parsePositiveInteger(args.limit, "--limit") : 5;
    query = query.limit(limit);
  }

  return throwIfSupabaseError(await query, "Failed to find Timataka import candidates");
}

function printCandidateList(races) {
  if (races.length === 0) {
    console.log("No Timataka import candidates found.");
    return;
  }

  console.log(`Found ${races.length} Timataka import candidate${races.length === 1 ? "" : "s"}:`);
  for (const race of races) {
    console.log(
      `- ${race.source_race_id}: ${race.name} (${race.import_status}, ${race.source_url})`,
    );
  }
}

async function main() {
  const args = parseArgs();
  const supabase = createServiceClient({ target: args.target ?? "local" });
  const races = await findCandidateRaces(supabase, args);

  if (args["dry-run"]) {
    printCandidateList(races);
    return;
  }

  if (races.length === 0) {
    console.log("No Timataka races to import.");
    return;
  }

  const imported = [];
  const failed = [];

  for (const race of races) {
    try {
      const result = await importRaceResults(supabase, race);
      imported.push(result);
    } catch (error) {
      failed.push({
        sourceRaceId: race.source_race_id,
        name: race.name,
        error: error.message,
      });
      console.error(`Failed to import ${race.source_race_id}: ${error.message}`);
      if (!args["continue-on-error"]) throw error;
    }
  }

  const finisherCount = imported.reduce((total, result) => total + result.finishers, 0);
  console.log(
    `Batch complete: imported ${imported.length}/${races.length} races with ${finisherCount} finishers.`,
  );

  if (failed.length > 0) {
    console.log(`Failed races: ${failed.map((failure) => failure.sourceRaceId).join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
