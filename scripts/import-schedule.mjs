import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Operational notes and safety rules live in docs/import_pipeline.md.
import {
  categoryFromUrl,
  createServiceClient,
  distanceMetersFromKm,
  normalizeDistanceLabel,
  parseArgs,
  parseCsv,
  sourceEventId,
  sourceRaceId,
  throwIfSupabaseError,
} from "./import-utils.mjs";

const inputPath = resolve("schedule_results.csv");

function eventRows(rows) {
  const bySourceEventId = new Map();
  for (const row of rows) {
    const key = sourceEventId(row);
    const current = bySourceEventId.get(key);
    if (!current || (!current.results && row.results)) {
      bySourceEventId.set(key, row);
    }
  }
  return [...bySourceEventId.values()];
}

async function main() {
  const args = parseArgs();
  const rows = parseCsv(await readFile(inputPath, "utf8"));
  const supabase = createServiceClient({ target: args.target ?? "local" });

  const events = eventRows(rows).map((row) => ({
    source_event_id: sourceEventId(row),
    name: row.run.trim(),
    normalized_name: row.run.trim().toLocaleLowerCase("is-IS"),
    event_date: row.date,
    source: "schedule_results",
    source_url: row.results || null,
    import_status: rows.some((candidate) => candidate.id === row.id && candidate.results)
      ? "results_available"
      : "pending",
    is_mock: false,
  }));

  const upsertedEvents = throwIfSupabaseError(
    await supabase
      .from("events")
      .upsert(events, { onConflict: "source,source_event_id" })
      .select("id, source_event_id"),
    "Failed to upsert events",
  );
  const eventIdBySource = new Map(
    upsertedEvents.map((event) => [event.source_event_id, event.id]),
  );

  const races = rows.map((row) => {
    const sourceId = sourceRaceId(row);
    const resultUrl = row.results || null;
    const category = categoryFromUrl(resultUrl);
    return {
      source_race_id: sourceId,
      event_id: eventIdBySource.get(sourceEventId(row)),
      name: row.run.trim(),
      distance_meters: distanceMetersFromKm(row.km),
      distance_label: normalizeDistanceLabel(row.km),
      category,
      race_tier: row.rank.trim().toLowerCase(),
      race_type: row.type.trim(),
      timing_provider: "timataka",
      source_url: resultUrl,
      import_status: resultUrl ? "results_available" : "pending",
      is_icelandic_championship: row.is_icelandic_championship === "1",
      is_mock: false,
    };
  });

  throwIfSupabaseError(
    await supabase
      .from("races")
      .upsert(races, { onConflict: "timing_provider,source_race_id" })
      .select("id"),
    "Failed to upsert races",
  );

  const linkedRows = rows.filter((row) => row.results).length;
  console.log(
    `Imported ${events.length} events and ${races.length} races from ${inputPath}; ${linkedRows} races have Timataka result links.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
