import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  DEFAULT_PUFFIN_URL,
  parseTimatakaResults,
  timatakaCategoryUrl,
} from "./timataka-parser.mjs";

const url = process.argv[2] ?? DEFAULT_PUFFIN_URL;
const outputPath = resolve("src/data/timataka-puffin-2026.json");

async function main() {
  const importedRace = await fetchCategory(url, "overall");
  const maleRace = await fetchCategory(url, "m");
  const femaleRace = await fetchCategory(url, "f");
  const genderByAthlete = new Map();

  for (const result of maleRace.results) {
    genderByAthlete.set(result.athleteId, {
      genderCategory: "m",
      rankGender: result.rankGender,
    });
  }

  for (const result of femaleRace.results) {
    genderByAthlete.set(result.athleteId, {
      genderCategory: "f",
      rankGender: result.rankGender,
    });
  }

  importedRace.genderSources = {
    m: maleRace.sourceUrl,
    f: femaleRace.sourceUrl,
  };
  importedRace.categoryCounts = {
    overall: importedRace.results.length,
    m: maleRace.results.length,
    f: femaleRace.results.length,
    unknown: 0,
  };
  importedRace.results = importedRace.results.map((result) => {
    const gender = genderByAthlete.get(result.athleteId) ?? {
      genderCategory: "unknown",
      rankGender: null,
    };
    return {
      ...result,
      ...gender,
    };
  });
  importedRace.categoryCounts.unknown = importedRace.results.filter(
    (result) => result.genderCategory === "unknown",
  ).length;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(importedRace, null, 2)}\n`);

  console.log(
    `Imported ${importedRace.results.length} overall, ${maleRace.results.length} male, and ${femaleRace.results.length} female finishers from ${importedRace.event.name} to ${outputPath}`,
  );
}

async function fetchCategory(baseUrl, category) {
  const categoryUrl = timatakaCategoryUrl(baseUrl, category);
  const response = await fetch(categoryUrl, {
    headers: {
      "user-agent": "ice-run-champ/0.1 (+https://github.com/) one-race-import",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${categoryUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return parseTimatakaResults(html, categoryUrl, category);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
