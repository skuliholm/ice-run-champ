import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const correctionsPath = resolve("src/data/import-corrections.json");

let cachedCorrections = null;

export async function loadImportCorrections() {
  if (cachedCorrections) return cachedCorrections;
  const data = JSON.parse(await readFile(correctionsPath, "utf8"));
  cachedCorrections = data;
  return cachedCorrections;
}

export async function applyTimatakaCorrections(sourceRaceId, results) {
  const corrections = await loadImportCorrections();
  const correctionByKey = new Map(
    (corrections.timataka ?? []).map((correction) => [
      resultCorrectionKey(sourceRaceId, correction.normalizedName, correction.birthYear),
      correction,
    ]),
  );

  return results.map((result) => {
    const correction = correctionByKey.get(
      resultCorrectionKey(sourceRaceId, result.normalizedName, result.birthYear),
    );
    if (!correction) return result;

    return {
      ...result,
      genderCategory: correction.genderCategory ?? result.genderCategory,
      rankGender:
        correction.genderCategory && correction.genderCategory !== result.genderCategory
          ? null
          : result.rankGender,
      correction: {
        source: "manual",
        reason: correction.reason,
      },
    };
  });
}

function resultCorrectionKey(sourceRaceId, normalizedName, birthYear) {
  return `${sourceRaceId}|${normalizedName}|${birthYear ?? "unknown"}`;
}
