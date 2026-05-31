import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { StatusPill } from "@/app/_components/status-pill";
import { formatDate, formatOptionalRaceDistance, formatRaceDistance, ircData, topResults } from "@/lib/irc-data";
import { getLiveProvisionalStandings, getLiveRaceCalendar } from "@/lib/supabase-data";

export default async function Home() {
  const [liveRaces, liveStandings] = await Promise.all([
    getLiveRaceCalendar(),
    getLiveProvisionalStandings(),
  ]);
  const realRace = ircData.races.find((race) => !race.isMock) ?? ircData.races[0];
  const topMen = liveStandings.men.length ? liveStandings.men.slice(0, 8) : ircData.menStandings.slice(0, 8);
  const topWomen = liveStandings.women.length ? liveStandings.women.slice(0, 8) : ircData.womenStandings.slice(0, 8);
  const importedRaceCount = liveRaces.filter((race) => race.importStatus === "imported").length;
  const resultLinkCount = liveRaces.filter((race) => race.sourceUrl).length;
  const featuredLiveRace = liveRaces.find((race) => race.importStatus === "imported");
  const featuredRaceHref = featuredLiveRace ? `/races/${featuredLiveRace.id}` : `/races/${realRace.id}`;
  const featuredRaceName = featuredLiveRace?.eventName ?? realRace.event.name;
  const featuredRaceDistance = featuredLiveRace
    ? formatOptionalRaceDistance(featuredLiveRace.distanceMeters, featuredLiveRace.distanceLabel)
    : formatRaceDistance(realRace.distanceMeters);
  const featuredRaceDate = featuredLiveRace?.date ?? realRace.event.date;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <div className="mb-5 flex flex-wrap gap-2">
                <StatusPill tone="emerald">
                  {liveRaces.length ? `${liveRaces.length} Supabase races` : "One real Timataka race"}
                </StatusPill>
                <StatusPill tone={liveStandings.men.length || liveStandings.women.length ? "emerald" : "amber"}>
                  {liveStandings.men.length || liveStandings.women.length
                    ? "Live provisional standings"
                    : "Prototype standings"}
                </StatusPill>
                <StatusPill tone="blue">Provisional V1 rules</StatusPill>
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                Icelandic running standings from real race data.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                The race calendar and provisional standings now come from the hosted Supabase
                import pipeline. Scoring is intentionally simple while eligibility and tier rules
                are finalized.
              </p>
              <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Finishers" value={String(realRace.finished ?? realRace.results.length)} />
                <Metric label="Calendar races" value={String(liveRaces.length || ircData.races.length)} />
                <Metric label="Result links" value={String(resultLinkCount || 1)} />
                <Metric label="Season" value={String(ircData.season)} />
              </div>
            </div>
            <div className="overflow-hidden rounded border border-slate-200 bg-slate-950 text-white">
              <div className="grid min-h-72 grid-rows-[1fr_auto] bg-[linear-gradient(135deg,#064e3b_0%,#0f172a_54%,#f59e0b_100%)]">
                <div className="p-6">
                  <p className="text-sm font-medium text-emerald-100">Source race</p>
                  <h2 className="mt-3 text-3xl font-semibold">{featuredRaceName}</h2>
                  <p className="mt-2 text-sm text-slate-200">
                    {featuredRaceDistance} · {formatDate(featuredRaceDate)}
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
                    href={featuredRaceHref}
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
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Provisional Standings</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Live imported results scored as 101 minus gender placing. Race tiers, eligibility,
              best-result limits, and Elo are not applied yet.
            </p>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <RankingTable title="Men" rows={topMen} valueLabel="Pts" />
            <RankingTable title="Women" rows={topWomen} valueLabel="Pts" />
          </div>
        </section>

        <section id="races" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Race Calendar</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {liveRaces.length
                    ? `${importedRaceCount} imported result set and ${resultLinkCount} Timataka links from Supabase.`
                    : "Supabase calendar is unavailable; showing the prototype JSON dataset."}
                </p>
              </div>
              <Link href="/methodology" className="text-sm font-semibold text-emerald-700">
                Methodology
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {liveRaces.length
                ? liveRaces.map((race) => (
                    <Link
                      key={race.id}
                      href={`/races/${race.id}`}
                      className="rounded border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{race.eventName}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatDate(race.date)} ·{" "}
                            {formatOptionalRaceDistance(race.distanceMeters, race.distanceLabel)}
                          </p>
                        </div>
                        <StatusPill tone={race.importStatus === "imported" ? "emerald" : "blue"}>
                          {race.importStatus === "imported" ? "Imported" : "Scheduled"}
                        </StatusPill>
                      </div>
                      <p className="mt-4 text-sm text-slate-600">
                        {race.raceTier.toUpperCase()} tier · {race.raceType ?? "Race"}
                        {race.isIcelandicChampionship ? " · Icelandic championship" : ""}
                      </p>
                    </Link>
                  ))
                : ircData.races.map((race) => (
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
          Race calendar and provisional standings read from Supabase when public env vars are
          available. Fallback mock standings generated {formatDate(ircData.generatedAt.slice(0, 10))}.
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
    racesCount?: number;
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
              <th className="px-4 py-3 text-right">Races</th>
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
                  <td className="px-4 py-3 text-right font-mono">{row.racesCount ?? "-"}</td>
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
