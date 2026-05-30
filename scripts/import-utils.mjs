import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const ENV_FILES = [".env.local", ".env"];

export async function loadEnvFiles() {
  for (const path of ENV_FILES) {
    let contents;
    try {
      contents = await readFile(path, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      continue;
    }

    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = unquoteEnvValue(match[2]);
    }
  }
}

function unquoteEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  const [headers, ...body] = rows.filter((candidate) => candidate.some(Boolean));
  if (!headers) return [];
  return body.map((candidate) =>
    Object.fromEntries(headers.map((header, index) => [header, candidate[index] ?? ""])),
  );
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeDistanceLabel(value) {
  return String(value).trim().replace(",", ".");
}

export function distanceMetersFromKm(value) {
  const label = normalizeDistanceLabel(value);
  if (/^\d+(?:\.\d+)?$/.test(label)) return Math.round(Number(label) * 1000);
  return null;
}

export function categoryFromUrl(sourceUrl) {
  if (!sourceUrl) return "overall";
  const url = new URL(sourceUrl);
  return url.searchParams.get("cat") || "overall";
}

export function sourceEventId(row) {
  return `schedule-2026-${row.id}`;
}

export function sourceRaceId(row) {
  const category = categoryFromUrl(row.results);
  const distance = slugify(normalizeDistanceLabel(row.km));
  return `${sourceEventId(row)}-${distance}-${category}`;
}

export async function createServiceClient() {
  await loadEnvFiles();
  const cliEnv = readSupabaseStatusEnv();
  const url =
    process.env.SUPABASE_URL ??
    process.env.SUPABASE_API_URL ??
    cliEnv.API_URL ??
    "http://127.0.0.1:54321";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    cliEnv.SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Start local Supabase and run `supabase status -o env`, or add the service role key to your shell environment.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function readSupabaseStatusEnv() {
  try {
    const output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return Object.fromEntries(
      output
        .split(/\r?\n/)
        .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
        .filter(Boolean)
        .map((match) => [match[1], unquoteEnvValue(match[2])]),
    );
  } catch {
    return {};
  }
}

export function throwIfSupabaseError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}
