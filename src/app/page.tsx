import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { StatusPill } from "@/app/_components/status-pill";
import { formatDate, formatRaceDistance, ircData, topResults } from "@/lib/irc-data";

export default function Home() {
  const realRace = ircData.races.find((race) => !race.isMock) ?? ircData.races[0];
  const topMen = ircData.menStandings.slice(0, 8);
  const topWomen = ircData.womenStandings.slice(0, 8);
  const topElo = ircData.eloRankings.slice(0, 8);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <div className="mb-5 flex flex-wrap gap-2">
                <StatusPill tone="emerald">One real Timataka race</StatusPill>
                <StatusPill tone="amber">10 mock races</StatusPill>
                <StatusPill tone="blue">Provisional V1 rules</StatusPill>
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                Icelandic running standings from real race data.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                The prototype starts with Puffin Run 2026 results from Timataka, then extends that
                athlete pool into mock races so men&apos;s and women&apos;s championship points,
                genderless Elo rankings, and race pages can be tested end to end.
              </p>
              <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Finishers" value={String(realRace.finished ?? realRace.results.length)} />
                <Metric label="Races" value={String(ircData.races.length)} />
                <Metric label="Athletes" value={String(ircData.athletes.length)} />
                <Metric label="Season" value={String(ircData.season)} />
              </div>
            </div>
            <div className="overflow-hidden rounded border border-slate-200 bg-slate-950 text-white">
              <div className="grid min-h-72 grid-rows-[1fr_auto] bg-[linear-gradient(135deg,#064e3b_0%,#0f172a_54%,#f59e0b_100%)]">
                <div className="p-6">
                  <p className="text-sm font-medium text-emerald-100">Source race</p>
                  <h2 className="mt-3 text-3xl font-semibold">{realRace.event.name}</h2>
                  <p className="mt-2 text-sm text-slate-200">
                    {formatRaceDistance(realRace.distanceMeters)} · {formatDate(realRace.event.date)}
                  </p>
                </div>
                <div className="border-t border-white/15 bg-black/25 p-6">
                  <ol className="space-y-3">
                    {topResults(realRace, 3).map((result) => (
                      <li key={result.athleteId} className="flex items-center justify-between gap-4">
                        <span>
                          <span className="mr-3 text-sm text-slate-300">{result.rankOverall}</span>
                          <span className="font-medium">{result.name}</span>
                        </span>
                        <span className="font-mono text-sm">{result.chiptime}</span>
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={`/races/${realRace.id}`}
                    className="mt-5 inline-flex rounded bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-50"
                  >
                    View full race
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="standings" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-3">
            <RankingTable title="Men's Championship" rows={topMen} valueLabel="Pts" />
            <RankingTable title="Women's Championship" rows={topWomen} valueLabel="Pts" />
            <RankingTable title="Overall Elo Power Ranking" rows={topElo} valueLabel="Elo" isElo />
          </div>
        </section>

        <section id="races" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Race Calendar Dataset</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Puffin Run is imported. The rest are generated from the same athlete pool.
                </p>
              </div>
              <Link href="/methodology" className="text-sm font-semibold text-emerald-700">
                Methodology
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ircData.races.map((race) => (
                <Link
                  key={race.id}
                  href={`/races/${race.id}`}
                  className="rounded border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{race.event.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatDate(race.event.date)} · {formatRaceDistance(race.distanceMeters)}
                      </p>
                    </div>
                    <StatusPill tone={race.isMock ? "amber" : "emerald"}>
                      {race.isMock ? "Mock" : "Imported"}
                    </StatusPill>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    {race.finished} finishers · {race.raceTier} tier · {race.event.region}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
          Data generated {formatDate(ircData.generatedAt.slice(0, 10))}. Mock races are not official
          results.
        </section>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase text-slate-500">{label}</div>
    </div>
  );
}

function RankingTable({
  title,
  rows,
  valueLabel,
  isElo = false,
}: {
  title: string;
  rows: Array<{
    rank: number;
    athleteId: string;
    athleteName: string;
    club: string | null;
    totalPoints?: number;
    rating?: number;
  }>;
  valueLabel: string;
  isElo?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">Rank</th>
              <th className="px-4 py-3">Athlete</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3 text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const athlete = ircData.athletes.find((entry) => entry.id === row.athleteId);
              return (
                <tr key={row.athleteId}>
                  <td className="px-4 py-3 font-semibold">{row.rank}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/athletes/${athlete?.slug ?? row.athleteId}`}
                      className="font-medium text-slate-950 hover:text-emerald-700"
                    >
                      {row.athleteName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.club ?? "Unattached"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {isElo ? row.rating?.toFixed(0) : row.totalPoints?.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
