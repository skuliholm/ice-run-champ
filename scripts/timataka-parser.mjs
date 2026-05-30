export const DEFAULT_PUFFIN_URL =
  "https://timataka.net/thepuffinrun2026/urslit/?cat=overall&race=1";

export function timatakaCategoryUrl(sourceUrl, category) {
  const url = new URL(sourceUrl);
  url.searchParams.set("cat", category);
  return url.toString();
}

const ICELANDIC_MONTHS = new Map([
  ["jan", 1],
  ["janúar", 1],
  ["feb", 2],
  ["febrúar", 2],
  ["mar", 3],
  ["mars", 3],
  ["apr", 4],
  ["apríl", 4],
  ["maí", 5],
  ["jun", 6],
  ["júní", 6],
  ["jul", 7],
  ["júlí", 7],
  ["ágú", 8],
  ["ágúst", 8],
  ["sep", 9],
  ["september", 9],
  ["okt", 10],
  ["október", 10],
  ["nov", 11],
  ["nóvember", 11],
  ["des", 12],
  ["desember", 12],
]);

const htmlEntities = {
  amp: "&",
  gt: ">",
  lt: "<",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (_, entity) => htmlEntities[entity] ?? `&${entity};`);
}

export function textFromHtml(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim(),
  );
}

export function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDurationToSeconds(value) {
  if (!value || value === "-") return null;
  const clean = value.trim().replace(/^\+/, "");
  const parts = clean.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function formatSeconds(totalSeconds) {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function parseDateFromText(text) {
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const dateMatch = text.match(/\b(\d{1,2})\.\s*([A-Za-zÁÉÍÓÚÝÞÆÖáéíóúýþæö]+)\b/);
  if (!yearMatch || !dateMatch) return null;
  const month = ICELANDIC_MONTHS.get(dateMatch[2].toLowerCase());
  if (!month) return null;
  return `${yearMatch[1]}-${String(month).padStart(2, "0")}-${String(
    Number(dateMatch[1]),
  ).padStart(2, "0")}`;
}

function parseRowsFromTable(html) {
  const rows = [];
  const trMatches = html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const trMatch of trMatches) {
    const cells = [...trMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => textFromHtml(cell[1]))
      .filter(Boolean);
    if (cells.length >= 5) rows.push(cells);
  }
  return rows;
}

function splitResultRow(cells) {
  const [rank, bib, name, birthYear, ...remaining] = cells;
  const rankNumber = Number(rank);
  const bibNumber = Number(bib);
  const yearNumber = Number(birthYear);
  if (!Number.isInteger(rankNumber) || !Number.isInteger(bibNumber)) return null;

  const firstTailCellIsSplit = /\d{2}:\d{2}.*\([^)]+\)/.test(remaining[0] ?? "");
  const club = firstTailCellIsSplit ? null : remaining[0];
  const split = firstTailCellIsSplit ? remaining[0] : remaining[1];
  const timeCells = firstTailCellIsSplit ? remaining.slice(1) : remaining.slice(2);
  const [time, maybeBehind, maybeChiptime] = timeCells;
  const behind = maybeBehind?.startsWith("+") ? maybeBehind : null;
  const chiptime = behind ? maybeChiptime : maybeBehind;

  if (!name || !/\d{2}:\d{2}/.test(time ?? "")) return null;

  return {
    rankOverall: rankNumber,
    bib: bibNumber,
    name,
    birthYear: Number.isInteger(yearNumber) ? yearNumber : null,
    club: club && club !== "." ? club : null,
    splits: parseSplits(split ?? ""),
    time: time ?? null,
    behind,
    chiptime: chiptime && chiptime !== "-" ? chiptime : time ?? null,
    finishSeconds: parseDurationToSeconds(chiptime || time),
    rawCells: cells,
  };
}

function parseSplits(value) {
  return value
    .split("\n")
    .map((line) => {
      const match = line.match(/(\d{2}:\d{2}(?::\d{2})?)\s*\(([^)]+)\)/);
      if (!match) return null;
      return {
        label: match[2],
        time: match[1],
        seconds: parseDurationToSeconds(match[1]),
      };
    })
    .filter(Boolean);
}

function titleFromText(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    lines.find((line) => line.includes("The Puffin Run")) ??
    lines.find((line) => line.length > 6) ??
    "Timataka race"
  );
}

export function parseTimatakaResults(
  html,
  sourceUrl = DEFAULT_PUFFIN_URL,
  category = "overall",
  metadata = {},
) {
  const pageText = textFromHtml(html);
  const tableRows = parseRowsFromTable(html);
  const parsedRows = tableRows.map(splitResultRow).filter(Boolean);

  if (parsedRows.length === 0) {
    throw new Error("No Timataka result rows were found in the supplied HTML.");
  }

  const eventName = titleFromText(pageText)
    .replace(/^TÍMATAKA:\s*/i, "")
    .replace(/\s+-\s+Heimaeyjarhringurinn.*$/i, "")
    .replace(/\s+2026$/, "");
  const date = metadata.event?.date ?? parseDateFromText(pageText) ?? "2026-05-02";
  const startedFinishedMatch = pageText.match(/Started\s*\/\s*Finished\s+(\d+)\s*\/\s*(\d+)/i);
  const eventId = metadata.event?.id ?? "the-puffin-run-2026";
  const raceId = metadata.race?.id ?? "the-puffin-run-2026-overall";
  const distanceMeters =
    metadata.race && "distanceMeters" in metadata.race ? metadata.race.distanceMeters : 21098;

  return {
    sourceUrl,
    importedAt: new Date().toISOString(),
    category,
    event: {
      id: eventId,
      name: metadata.event?.name ?? eventName,
      date,
      region: metadata.event?.region ?? "Vestmannaeyjar",
      source: metadata.event?.source ?? "timataka",
      sourceUrl,
      importStatus: metadata.event?.importStatus ?? "imported",
      isMock: false,
    },
    race: {
      id: raceId,
      eventId,
      name: metadata.race?.name ?? "Heimaeyjarhringurinn",
      distanceMeters,
      category: metadata.race?.category ?? "overall",
      raceTier: metadata.race?.raceTier ?? "major",
      timingProvider: metadata.race?.timingProvider ?? "timataka",
      sourceUrl,
      importStatus: metadata.race?.importStatus ?? "imported",
      isMock: false,
      started: startedFinishedMatch ? Number(startedFinishedMatch[1]) : parsedRows.length,
      finished: parsedRows.length,
    },
    results: parsedRows.map((row) => ({
      ...row,
      athleteId: normalizeName(`${row.name}-${row.birthYear ?? "unknown"}`),
      normalizedName: normalizeName(row.name),
      genderCategory: category === "m" || category === "f" ? category : "unknown",
      rankGender: category === "m" || category === "f" ? row.rankOverall : null,
      isMock: false,
    })),
  };
}
