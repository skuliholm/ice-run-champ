import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/site-header";
import {
  formatDate,
  formatGenderCategory,
  formatOptionalRaceDistance,
  formatRaceDistance,
  getRaceById,
  ircData,
} from "@/lib/irc-data";
import { getLiveRaceDetail, type LiveRaceResult } from "@/lib/supabase-data";

type RaceResultRow = {
  athleteId: string | null;
  rankOverall: number | null;
  rankGender: number | null;
  bib: number | null;
  name: string;
  club: string | null;
  genderCategory: string;
  time: string | null;
  chiptime: string | null;
  behind: string | null;
};

export function generateStaticParams() {
  return ircData.races.map((race) => ({ raceId: race.id }));
}

export default async function RacePage({ params }: { params: Promise<{ raceId: string }> }) {
  const { raceId } = await params;
  const liveRace = await getLiveRaceDetail(raceId);
  if (liveRace) {
    return (
      <RaceDetail
        title={liveRace.eventName}
        subtitle={`${liveRace.name} · ${formatOptionalRaceDistance(liveRace.distanceMeters, liveRace.distanceLabel)} · ${formatDate(liveRace.date)}`}
        sourceUrl={liveRace.sourceUrl}
        status={liveRace.importStatus === "imported" ? "Final" : "Scheduled"}
        tier={liveRace.raceTier}
        championship={liveRace.isIcelandicChampionship}
        results={liveRace.results}
      />
    );
  }

  const race = getRaceById(raceId);
  if (!race) notFound();

  return (
    <RaceDetail
      title={race.event.name}
      subtitle={`${race.name} · ${formatRaceDistance(race.distanceMeters)} · ${formatDate(race.event.date)} · ${race.event.region}`}
      sourceUrl={race.sourceUrl}
      status={race.isMock ? "Provisional" : "Final"}
      tier={race.raceTier}
      championship={Boolean((race as { isIcelandicChampionship?: boolean }).isIcelandicChampionship)}
      results={race.results}
    />
  );
}

function RaceDetail({
  title,
  subtitle,
  sourceUrl,
  status,
  tier,
  championship,
  results,
}: {
  title: string;
  subtitle: string;
  sourceUrl?: string | null;
  status: string;
  tier: string;
  championship?: boolean;
  results: RaceResultRow[];
}) {
  const menCount = results.filter((result) => result.genderCategory === "m").length;
  const womenCount = results.filter((result) => result.genderCategory === "f").length;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-wide">Results</p>
              <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">{title}</h1>
              <p className="mt-3 text-sm font-black uppercase tracking-wide">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{status}</Badge>
              <Badge>{tier} tier</Badge>
              {championship ? <Badge>Championship</Badge> : null}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="border-2 border-[#151515] bg-[#f4f0e8] p-5">
            <div className="border-b-2 border-[#151515] pb-3">
              <h2 className="text-lg font-black tracking-tight">Race</h2>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <RaceMetric label="Finished" value={String(results.length)} />
              <RaceMetric label="Men" value={String(menCount)} />
              <RaceMetric label="Women" value={String(womenCount)} />
              <RaceMetric label="Tier" value={tier.toUpperCase()} />
            </dl>
            {sourceUrl ? (
              <a
                className="mt-5 inline-flex bg-[#151515] px-3 py-2 text-sm font-black text-[#f4f0e8]"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Source
              </a>
            ) : null}
          </div>

          <section className="border-2 border-[#151515] bg-white p-5">
            <div className="mb-3 border-b-2 border-[#151515] pb-2">
              <h2 className="text-lg font-black tracking-tight">Results</h2>
            </div>
            {results.length ? (
              <ResultsTable rows={results} />
            ) : (
              <div className="py-8 text-sm font-semibold text-[#69645d]">Results are scheduled.</div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

function ResultsTable({ rows }: { rows: RaceResultRow[] | LiveRaceResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <thead className="text-xs uppercase tracking-wide text-[#69645d]">
          <tr>
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Cat</th>
            <th className="py-2 pr-3">Cat #</th>
            <th className="py-2 pr-3">Bib</th>
            <th className="py-2 pr-3">Athlete</th>
            <th className="py-2 pr-3">Club</th>
            <th className="py-2 pr-3 text-right">Time</th>
            <th className="py-2 text-right">Behind</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d8d1c5]">
          {rows.map((result) => {
            const athlete = result.athleteId
              ? ircData.athletes.find((entry) => entry.id === result.athleteId || entry.slug === result.athleteId)
              : null;
            return (
              <tr key={`${result.rankOverall}-${result.rankGender}-${result.name}`}>
                <td className="py-2 pr-3 font-black tabular-nums">{result.rankOverall ?? "-"}</td>
                <td className="py-2 pr-3 text-[#69645d]">{formatGenderCategory(result.genderCategory)}</td>
                <td className="py-2 pr-3 font-semibold tabular-nums">{result.rankGender ?? "-"}</td>
                <td className="py-2 pr-3 text-[#69645d]">{result.bib ?? "-"}</td>
                <td className="py-2 pr-3 font-semibold">
                  {result.athleteId ? (
                    <Link className="underline-offset-4 hover:underline" href={`/athletes/${athlete?.slug ?? result.athleteId}`}>
                      {result.name}
                    </Link>
                  ) : (
                    result.name
                  )}
                </td>
                <td className="py-2 pr-3 text-[#69645d]">{result.club ?? "Unattached"}</td>
                <td className="py-2 pr-3 text-right font-mono font-semibold tabular-nums">
                  {result.chiptime ?? result.time ?? "-"}
                </td>
                <td className="py-2 text-right font-mono text-[#69645d]">{result.behind ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RaceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#151515] bg-white p-3">
      <dt className="text-xs font-black uppercase tracking-wide text-[#69645d]">{label}</dt>
      <dd className="mt-2 text-lg font-black tabular-nums">{value}</dd>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="border-2 border-[#151515] bg-[#f4f0e8] px-2 py-1 text-xs font-black uppercase tracking-wide">{children}</span>;
}
