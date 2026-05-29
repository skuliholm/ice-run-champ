import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { formatSeconds, normalizeName } from "./timataka-parser.mjs";

const inputPath = resolve("src/data/timataka-puffin-2026.json");
const outputPath = resolve("src/data/irc-v1.json");

const mockRaceTemplates = [
  ["reykjavik-spring-10k", "Reykjavik Spring 10K", "2026-04-18", "Reykjavik", 10000, "standard", 0.474],
  ["akureyri-harbor-5k", "Akureyri Harbor 5K", "2026-05-09", "North Iceland", 5000, "community", 0.236],
  ["midnight-sun-15k", "Midnight Sun 15K", "2026-06-20", "Reykjavik", 15000, "standard", 0.711],
  ["thingvellir-trail-12k", "Thingvellir Trail 12K", "2026-07-04", "South Iceland", 12000, "trail", 0.63],
  ["westfjords-coastal-half", "Westfjords Coastal Half", "2026-07-18", "Westfjords", 21098, "major", 1.035],
  ["egilsstadir-lake-10k", "Egilsstadir Lake 10K", "2026-08-01", "East Iceland", 10000, "standard", 0.49],
  ["selfoss-river-run", "Selfoss River Run", "2026-08-15", "South Iceland", 8000, "community", 0.384],
  ["snaefellsnes-half", "Snaefellsnes Half", "2026-08-29", "West Iceland", 21098, "major", 1.02],
  ["hafnarfjordur-night-10k", "Hafnarfjordur Night 10K", "2026-09-12", "Capital Region", 10000, "standard", 0.468],
  ["reykjanes-finale-15k", "Reykjanes Finale 15K", "2026-09-26", "Reykjanes", 15000, "championship", 0.705],
];

const tierMultipliers = {
  community: 0.85,
  standard: 1,
  trail: 1.05,
  major: 1.2,
  championship: 1.35,
};

const placingPoints = [
  100, 88, 78, 70, 64, 58, 53, 49, 45, 42, 39, 36, 34, 32, 30, 28, 26, 24, 22, 20,
];

function pseudoRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, "-");
}

function secondsForMock(baseSeconds, distanceFactor, athleteIndex, raceIndex, random) {
  const formSwing = 1 + (random() - 0.48) * 0.09;
  const terrainSwing = 1 + ((raceIndex % 4) - 1.5) * 0.012;
  const packFade = 1 + Math.min(0.18, athleteIndex * 0.0007);
  return Math.round(baseSeconds * distanceFactor * formSwing * terrainSwing * packFade);
}

function buildAthletes(realResults) {
  const seen = new Set();
  return realResults
    .filter((result) => result.finishSeconds && result.birthYear)
    .map((result) => ({
      id: result.athleteId,
      fullName: result.name,
      normalizedName: result.normalizedName,
      birthYear: result.birthYear,
      club: result.club,
      genderCategory: result.genderCategory ?? "unknown",
      isMock: false,
      baseHalfSeconds: result.finishSeconds,
    }))
    .filter((athlete) => {
      if (seen.has(athlete.id)) return false;
      seen.add(athlete.id);
      return true;
    });
}

function scoreRace(results, race, genderCategory) {
  return results
    .filter((result) => result.genderCategory === genderCategory)
    .sort((a, b) => a.finishSeconds - b.finishSeconds)
    .map((result, index) => {
    const rawPoints = placingPoints[index] ?? Math.max(1, 20 - Math.floor((index - 19) / 5));
    const multiplier = tierMultipliers[race.raceTier] ?? 1;
    return {
      raceId: race.id,
      athleteId: result.athleteId,
      genderCategory,
      raceTier: race.raceTier,
      placingPoints: rawPoints,
      tierMultiplier: multiplier,
      totalPoints: Number((rawPoints * multiplier).toFixed(2)),
      countsForStandings: true,
    };
  });
}

function calculateElo(races) {
  const ratings = new Map();
  const history = [];

  for (const race of races) {
    const finishers = race.results.filter((result) => result.finishSeconds);
    const fieldSize = finishers.length;
    const k = 16 * (tierMultipliers[race.raceTier] ?? 1);

    finishers.forEach((result, index) => {
      const ratingBefore = ratings.get(result.athleteId) ?? 1500;
      const expectedScore = (fieldSize - 1) / 2;
      const actualScore = fieldSize - 1 - index;
      const delta = ((actualScore - expectedScore) / Math.max(1, fieldSize - 1)) * k;
      const ratingAfter = Number((ratingBefore + delta).toFixed(2));
      ratings.set(result.athleteId, ratingAfter);
      history.push({
        raceId: race.id,
        athleteId: result.athleteId,
        ratingBefore: Number(ratingBefore.toFixed(2)),
        ratingAfter,
        ratingDelta: Number(delta.toFixed(2)),
      });
    });
  }

  return { ratings, history };
}

function standingsFromScores(scores, athletes) {
  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const totals = new Map();
  for (const score of scores) {
    const current = totals.get(score.athleteId) ?? {
      athleteId: score.athleteId,
      athleteName: athleteById.get(score.athleteId)?.fullName ?? "Unknown athlete",
      club: athleteById.get(score.athleteId)?.club ?? null,
      genderCategory: score.genderCategory,
      totalPoints: 0,
      racesCount: 0,
    };
    current.totalPoints += score.totalPoints;
    current.racesCount += 1;
    totals.set(score.athleteId, current);
  }

  return [...totals.values()]
    .map((standing) => ({
      ...standing,
      totalPoints: Number(standing.totalPoints.toFixed(2)),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((standing, index) => ({ rank: index + 1, ...standing }));
}

async function main() {
  const importedRace = JSON.parse(await readFile(inputPath, "utf8"));
  const athletes = buildAthletes(importedRace.results);
  const random = pseudoRandom(20260528);

  const realRace = {
    ...importedRace.race,
    event: importedRace.event,
    results: importedRace.results,
  };

  const mockRaces = mockRaceTemplates.map(
    ([slug, name, date, region, distanceMeters, raceTier, distanceFactor], raceIndex) => {
      const selected = athletes
        .filter((_, athleteIndex) => (athleteIndex + raceIndex) % 3 !== 1 || athleteIndex < 45)
        .slice(0, 185 + ((raceIndex * 19) % 125))
        .map((athlete, athleteIndex) => {
          const finishSeconds = secondsForMock(
            athlete.baseHalfSeconds,
            distanceFactor,
            athleteIndex,
            raceIndex,
            random,
          );
          return {
            athleteId: athlete.id,
            name: athlete.fullName,
            normalizedName: athlete.normalizedName,
            birthYear: athlete.birthYear,
            club: athlete.club,
            genderCategory: athlete.genderCategory,
            finishSeconds,
            time: formatSeconds(finishSeconds),
            chiptime: formatSeconds(finishSeconds),
            isMock: true,
          };
        })
        .sort((a, b) => a.finishSeconds - b.finishSeconds);
      const winnerSeconds = selectedWinnerSeconds(selected);
      const genderRanks = new Map();
      const rankedResults = selected.map((result, index) => {
        const genderRank = (genderRanks.get(result.genderCategory) ?? 0) + 1;
        genderRanks.set(result.genderCategory, genderRank);
        return {
          ...result,
          rankOverall: index + 1,
          rankGender: result.genderCategory === "unknown" ? null : genderRank,
          bib: 2000 + raceIndex * 500 + index + 1,
          behind: index === 0 ? null : formatSeconds(result.finishSeconds - winnerSeconds),
        };
      });

      return {
        id: `${slug}-overall`,
        eventId: slug,
        name,
        event: {
          id: slug,
          name,
          date,
          region,
          source: "mock",
          sourceUrl: null,
          importStatus: "generated",
          isMock: true,
        },
        distanceMeters,
        category: "overall",
        raceTier,
        timingProvider: "mock",
        sourceUrl: null,
        importStatus: "generated",
        isMock: true,
        started: rankedResults.length,
        finished: rankedResults.length,
        results: rankedResults,
      };
    },
  );

  const races = [realRace, ...mockRaces];
  const menScores = races.flatMap((race) => scoreRace(race.results, race, "m"));
  const womenScores = races.flatMap((race) => scoreRace(race.results, race, "f"));
  const scores = [...menScores, ...womenScores];
  const { ratings, history } = calculateElo(races);
  const athleteList = athletes.map((athlete) => ({
    id: athlete.id,
    fullName: athlete.fullName,
    normalizedName: athlete.normalizedName,
    birthYear: athlete.birthYear,
    club: athlete.club,
    genderCategory: athlete.genderCategory,
    isMock: athlete.isMock,
    slug: slugify(`${athlete.fullName}-${athlete.birthYear}`),
  }));
  const menStandings = standingsFromScores(menScores, athleteList);
  const womenStandings = standingsFromScores(womenScores, athleteList);
  const athleteById = new Map(athleteList.map((athlete) => [athlete.id, athlete]));
  const eloRankings = [...ratings.entries()]
    .map(([athleteId, rating]) => ({
      athleteId,
      athleteName: athleteById.get(athleteId)?.fullName ?? "Unknown athlete",
      club: athleteById.get(athleteId)?.club ?? null,
      rating,
      racesCount: races.filter((race) =>
        race.results.some((result) => result.athleteId === athleteId),
      ).length,
    }))
    .sort((a, b) => b.rating - a.rating)
    .map((ranking, index) => ({ rank: index + 1, ...ranking }));

  const dataset = {
    generatedAt: new Date().toISOString(),
    season: 2026,
    sourceRaceUrl: importedRace.sourceUrl,
    methodology: {
      championship:
        "Men's and women's championship standings are scored separately from gender-category placing with race-tier multipliers. All generated races are mock data.",
      elo: "Prototype multiplayer Elo approximation based on overall finishing order and race tier. Elo is intentionally genderless.",
    },
    athletes: athleteList,
    races,
    championshipScores: scores,
    menStandings,
    womenStandings,
    eloRankings,
    eloHistory: history,
  };

  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);
  console.log(
    `Generated ${mockRaces.length} mock races, ${menStandings.length} men's standings rows, ${womenStandings.length} women's standings rows, and ${eloRankings.length} Elo rows in ${outputPath}`,
  );
}

function selectedWinnerSeconds(results) {
  return results.reduce((best, result) => Math.min(best, result.finishSeconds), Infinity);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
