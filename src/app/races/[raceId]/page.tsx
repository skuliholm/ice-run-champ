import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/site-header";
import { StatusPill } from "@/app/_components/status-pill";
import {
  formatDate,
  formatGenderCategory,
  formatOptionalRaceDistance,
  formatRaceDistance,
  getRaceById,
  ircData,
} from "@/lib/irc-data";
import { getLiveRaceDetail } from "@/lib/supabase-data";

export function generateStaticParams() {
  return ircData.races.map((race) => ({ raceId: race.id }));
}

export default async function RacePage({ params }: { params: Promise<{ raceId: string }> }) {
  const { raceId } = await params;
  const liveRace = await getLiveRaceDetail(raceId);
  if (liveRace) return <LiveRacePage race={liveRace} />;

  const race = getRaceById(raceId);
  if (!race) notFound();
  const menCount = race.results.filter((result) => result.genderCategory === "m").length;
  const womenCount = race.results.filter((result) => result.genderCategory === "f").length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Back to standings
          </Link>
        </div>
        <section className="rounded border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusPill tone={race.isMock ? "amber" : "emerald"}>
                  {race.isMock ? "Mock race" : "Imported from Timataka"}
                </StatusPill>
                <StatusPill tone="blue">{race.raceTier} tier</StatusPill>
              </div>
              <h1 className="text-3xl font-semibold">{race.event.name}</h1>
              <p className="mt-2 text-slate-600">
                {race.name} · {formatRaceDistance(race.distanceMeters)} ·{" "}
                {formatDate(race.event.date)} · {race.event.region}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <RaceMetric label="Started" value={String(race.started ?? race.results.length)} />
              <RaceMetric label="Finished" value={String(race.finished ?? race.results.length)} />
              <RaceMetric label="Men" value={String(menCount)} />
              <RaceMetric label="Women" value={String(womenCount)} />
              <RaceMetric label="Provider" value={race.timingProvider} />
            </div>
          </div>
          {race.sourceUrl ? (
            <a
              href={race.sourceUrl}
              className="mt-5 inline-flex text-sm font-semibold text-emerald-700"
              rel="noreferrer"
              target="_blank"
            >
              View source results
            </a>
          ) : null}
        </section>

        <section className="mt-6 overflow-hidden rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Cat</th>
                  <th className="px-4 py-3">Cat rank</th>
                  <th className="px-4 py-3">Bib</th>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Club</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3 text-right">Behind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {race.results.map((result) => {
                  const athlete = ircData.athletes.find((entry) => entry.id === result.athleteId);
                  return (
                    <tr key={`${race.id}-${result.athleteId}`}>
                      <td className="px-4 py-3 font-semibold">{result.rankOverall}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatGenderCategory(result.genderCategory)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{result.rankGender ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{result.bib}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/athletes/${athlete?.slug ?? result.athleteId}`}
                          className="font-medium hover:text-emerald-700"
                        >
                          {result.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{result.club ?? "Unattached"}</td>
                      <td className="px-4 py-3 text-right font-mono">{result.chiptime}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {result.behind ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

type LiveRacePageProps = {
  race: NonNullable<Awaited<ReturnType<typeof getLiveRaceDetail>>>;
};

function LiveRacePage({ race }: LiveRacePageProps) {
  const menCount = race.results.filter((result) => result.genderCategory === "m").length;
  const womenCount = race.results.filter((result) => result.genderCategory === "f").length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Back to standings
          </Link>
        </div>
        <section className="rounded border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusPill tone="emerald">Supabase</StatusPill>
                <StatusPill tone={race.importStatus === "imported" ? "emerald" : "blue"}>
                  {race.importStatus}
                </StatusPill>
                <StatusPill tone="blue">{race.raceTier} tier</StatusPill>
                {race.isIcelandicChampionship ? (
                  <StatusPill tone="amber">Icelandic championship</StatusPill>
                ) : null}
              </div>
              <h1 className="text-3xl font-semibold">{race.eventName}</h1>
              <p className="mt-2 text-slate-600">
                {race.name} · {formatOptionalRaceDistance(race.distanceMeters, race.distanceLabel)} ·{" "}
                {formatDate(race.date)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <RaceMetric label="Finished" value={String(race.results.length)} />
              <RaceMetric label="Men" value={String(menCount)} />
              <RaceMetric label="Women" value={String(womenCount)} />
              <RaceMetric label="Provider" value={race.provider} />
            </div>
          </div>
          {race.sourceUrl ? (
            <a
              href={race.sourceUrl}
              className="mt-5 inline-flex text-sm font-semibold text-emerald-700"
              rel="noreferrer"
              target="_blank"
            >
              View source results
            </a>
          ) : null}
        </section>

        <section className="mt-6 overflow-hidden rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Results</h2>
          </div>
          {race.results.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Cat</th>
                    <th className="px-4 py-3">Cat rank</th>
                    <th className="px-4 py-3">Bib</th>
                    <th className="px-4 py-3">Athlete</th>
                    <th className="px-4 py-3">Club</th>
                    <th className="px-4 py-3 text-right">Time</th>
                    <th className="px-4 py-3 text-right">Behind</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {race.results.map((result) => (
                    <tr key={`${race.id}-${result.rankOverall}-${result.name}-${result.birthYear}`}>
                      <td className="px-4 py-3 font-semibold">{result.rankOverall}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatGenderCategory(result.genderCategory)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{result.rankGender ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{result.bib ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{result.name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{result.club ?? "Unattached"}</td>
                      <td className="px-4 py-3 text-right font-mono">{result.time ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {result.behind ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-slate-600">
              Results are not imported for this scheduled race yet.
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function RaceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-lg font-semibold capitalize">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase text-slate-500">{label}</div>
    </div>
  );
}
