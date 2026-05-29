import dataset from "../src/data/irc-v1.json" with { type: "json" };
import importedRace from "../src/data/timataka-puffin-2026.json" with { type: "json" };

const VALID_GENDER_CATEGORIES = new Set(["m", "f", "unknown"]);

function fail(message) {
  console.error(`Data validation failed: ${message}`);
  process.exit(1);
}

function assertArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
}

function assertGenderCategory(value, label) {
  if (!VALID_GENDER_CATEGORIES.has(value)) {
    fail(`${label} has invalid genderCategory "${value}".`);
  }
}

assertArray(dataset.athletes, "athletes");
assertArray(dataset.races, "races");
assertArray(dataset.championshipScores, "championshipScores");
assertArray(dataset.menStandings, "menStandings");
assertArray(dataset.womenStandings, "womenStandings");
assertArray(dataset.eloRankings, "eloRankings");

if (!importedRace.categoryCounts) fail("imported Timataka race is missing categoryCounts.");
if (!importedRace.genderSources?.m || !importedRace.genderSources?.f) {
  fail("imported Timataka race is missing male/female gender source URLs.");
}

const athleteGenderCounts = { m: 0, f: 0, unknown: 0 };
for (const athlete of dataset.athletes) {
  assertGenderCategory(athlete.genderCategory, `athlete ${athlete.id}`);
  athleteGenderCounts[athlete.genderCategory] += 1;
}

for (const race of dataset.races) {
  assertArray(race.results, `race ${race.id}.results`);
  for (const result of race.results) {
    assertGenderCategory(result.genderCategory, `result ${race.id}/${result.athleteId}`);
    if ((result.genderCategory === "m" || result.genderCategory === "f") && !result.rankGender) {
      fail(`result ${race.id}/${result.athleteId} is missing rankGender.`);
    }
  }
}

for (const standing of dataset.menStandings) {
  if (standing.genderCategory !== "m") fail(`menStandings contains ${standing.athleteId} outside m.`);
}

for (const standing of dataset.womenStandings) {
  if (standing.genderCategory !== "f") fail(`womenStandings contains ${standing.athleteId} outside f.`);
}

if (dataset.menStandings.length !== athleteGenderCounts.m) {
  fail(`menStandings length ${dataset.menStandings.length} does not match ${athleteGenderCounts.m} male athletes.`);
}

if (dataset.womenStandings.length !== athleteGenderCounts.f) {
  fail(`womenStandings length ${dataset.womenStandings.length} does not match ${athleteGenderCounts.f} female athletes.`);
}

console.log(
  `Data validation passed: ${athleteGenderCounts.m} men, ${athleteGenderCounts.f} women, ${athleteGenderCounts.unknown} unknown.`,
);
