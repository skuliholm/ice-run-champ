import dataset from "@/data/irc-v1.json";

export type IrcDataset = typeof dataset;
export type Race = IrcDataset["races"][number];
export type RaceResult = Race["results"][number];
export type Athlete = IrcDataset["athletes"][number];

export const ircData = dataset;

export function formatRaceDistance(meters: number) {
  if (meters === 21098) return "Half marathon";
  if (meters % 1000 === 0) return `${meters / 1000}K`;
  return `${(meters / 1000).toFixed(1)}K`;
}

export function formatOptionalRaceDistance(meters: number | null, label?: string | null) {
  if (meters == null) return label ?? "Timed race";
  return formatRaceDistance(meters);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getRaceById(id: string) {
  return ircData.races.find((race) => race.id === id);
}

export function getAthleteBySlug(slug: string) {
  return ircData.athletes.find((athlete) => athlete.slug === slug);
}

export function getAthleteResults(athleteId: string) {
  return ircData.races
    .flatMap((race) => {
      const result = race.results.find((row) => row.athleteId === athleteId);
      if (!result) return [];
      return [{ race, result }];
    })
    .sort((a, b) => a.race.event.date.localeCompare(b.race.event.date));
}

export function getAthleteStanding(athleteId: string) {
  return (
    ircData.menStandings.find((standing) => standing.athleteId === athleteId) ??
    ircData.womenStandings.find((standing) => standing.athleteId === athleteId)
  );
}

export function formatGenderCategory(value: string) {
  if (value === "m") return "Men";
  if (value === "f") return "Women";
  return "Unknown";
}

export function getAthleteElo(athleteId: string) {
  return ircData.eloRankings.find((ranking) => ranking.athleteId === athleteId);
}

export function topResults(race: Race, count = 10) {
  return [...race.results]
    .sort((a, b) => a.rankOverall - b.rankOverall)
    .slice(0, count);
}

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
