import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import {
  formatDate,
  formatOptionalRaceDistance,
  formatRaceDistance,
  ircData,
  topResults,
} from "@/lib/irc-data";
import { getLiveProvisionalStandings, getLiveRaceCalendar, getLiveRaceDetail } from "@/lib/supabase-data";

type RankingRow = {
  rank: number;
  athleteId: string;
  athleteName: string;
  totalPoints?: number;
  rating?: number;
};

type ResultRow = {
  rankOverall: number | null;
  rankGender: number | null;
  athleteId: string | null;
  name: string;
  genderCategory: string;
  time: string | null;
  chiptime: string | null;
};

export default async function Home() {
  const [liveRaces, liveStandings] = await Promise.all([
    getLiveRaceCalendar(),
    getLiveProvisionalStandings(),
  ]);

  const fallbackRace = ircData.races.find((race) => !race.isMock) ?? ircData.races[0];
  const latestRaceCard = liveRaces.find((race) => race.importStatus === "imported") ?? liveRaces[0];
  const latestLiveRace = latestRaceCard ? await getLiveRaceDetail(latestRaceCard.id) : null;
  const latestRows: ResultRow[] = latestLiveRace?.results.length
    ? latestLiveRace.results
    : topResults(fallbackRace, fallbackRace.results.length).map((result) => ({
        rankOverall: result.rankOverall,
        rankGender: result.rankGender,
        athleteId: result.athleteId,
        name: result.name,
        genderCategory: result.genderCategory,
        time: result.time,
        chiptime: result.chiptime,
      }));

  const topMen = (liveStandings.men.length ? liveStandings.men : ircData.menStandings).slice(0, 10);
  const topWomen = (liveStandings.women.length ? liveStandings.women : ircData.womenStandings).slice(0, 10);
  const latestMen = latestRows
    .filter((result) => result.genderCategory === "m")
    .sort((a, b) => (a.rankGender ?? a.rankOverall ?? 9999) - (b.rankGender ?? b.rankOverall ?? 9999))
    .slice(0, 3);
  const latestWomen = latestRows
    .filter((result) => result.genderCategory === "f")
    .sort((a, b) => (a.rankGender ?? a.rankOverall ?? 9999) - (b.rankGender ?? b.rankOverall ?? 9999))
    .slice(0, 3);

  const raceName = latestLiveRace?.eventName ?? latestRaceCard?.eventName ?? fallbackRace.event.name;
  const raceHref = `/races/${latestLiveRace?.id ?? latestRaceCard?.id ?? fallbackRace.id}`;
  const raceDistance = latestLiveRace
    ? formatOptionalRaceDistance(latestLiveRace.distanceMeters, latestLiveRace.distanceLabel)
    : latestRaceCard
      ? formatOptionalRaceDistance(latestRaceCard.distanceMeters, latestRaceCard.distanceLabel)
      : formatRaceDistance(fallbackRace.distanceMeters);
  const raceDate = latestLiveRace?.date ?? latestRaceCard?.date ?? fallbackRace.event.date;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto grid max-w-7xl items-end gap-4 px-6 py-5 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-wide">2026 season</p>
              <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">
                Icelandic running rankings
              </h1>
            </div>
            <div className="flex gap-3">
              <Link className="bg-[#151515] px-3 py-2 text-sm font-black text-[#f4f0e8]" href="/standings">
                Standings
              </Link>
              <Link className="border-2 border-[#151515] px-3 py-2 text-sm font-black text-[#151515]" href="/races">
                Races
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 md:grid-cols-3">
          <RankingModule title="Men" href="/standings#men" rows={topMen} />
          <RankingModule title="Women" href="/standings#women" rows={topWomen} />
          <section className="bg-[#151515] p-5 text-[#f4f0e8]">
            <div className="inline-block bg-[#f05a28] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#151515]">
              Latest result
            </div>
            <h3 className="mt-4 text-4xl font-black leading-none tracking-[-0.05em]">{raceName}</h3>
            <p className="mt-2 text-sm font-semibold text-[#cfc8bd]">
              {raceDistance} · {formatDate(raceDate)}
            </p>
            <div className="mt-6 grid gap-5 border-t border-[#f4f0e8]/30 pt-4">
              <ResultMiniTable title="Men" rows={latestMen} />
              <ResultMiniTable title="Women" rows={latestWomen} />
            </div>
            <Link className="mt-6 inline-flex bg-[#f4f0e8] px-3 py-2 text-sm font-black text-[#151515]" href={raceHref}>
              Results
            </Link>
          </section>
        </div>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-2 border-[#151515] bg-white p-5">
            <div className="mb-3 flex items-baseline justify-between border-b-2 border-[#151515] pb-2">
              <h3 className="text-lg font-black tracking-tight">Elo</h3>
              <Link
                className="text-sm font-bold text-[#151515] underline decoration-[#f05a28] decoration-2 underline-offset-4"
                href="/elo"
              >
                Full list
              </Link>
            </div>
            <table className="w-full text-left text-[14px]">
              <thead className="text-xs uppercase tracking-wide text-[#69645d]">
                <tr>
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Athlete</th>
                  <th className="py-2 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8d1c5]">
                {ircData.eloRankings.slice(0, 10).map((row) => (
                  <tr key={row.athleteId}>
                    <td className="w-10 py-2 font-black tabular-nums">{row.rank}</td>
                    <td className="py-2 pr-2 font-semibold">
                      <AthleteLink athleteId={row.athleteId}>{row.athleteName}</AthleteLink>
                    </td>
                    <td className="py-2 text-right font-mono font-semibold tabular-nums">
                      {row.rating.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="border-2 border-[#151515] bg-[#f4f0e8]">
            <div className="border-b-2 border-[#151515] p-5">
              <h3 className="text-lg font-black tracking-tight">Methodology</h3>
            </div>
            <div className="divide-y divide-[#151515]">
              <MethodRow
                title="Standings"
                text="Season points from eligible race results. Best results count toward the championship table."
              />
              <MethodRow
                title="Elo"
                text="Ratings update after races using field strength, placing, and head-to-head outcomes."
              />
              <MethodRow title="Sources" text="Results are linked to published timing sources where available." />
            </div>
          </section>
        </section>

        <section className="border-y-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-2xl font-black tracking-[-0.04em]">Standings · Elo · Methodology</p>
            <Link className="bg-[#151515] px-4 py-3 text-sm font-black text-[#f4f0e8]" href="/methodology">
              Methodology
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function RankingModule({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: RankingRow[];
}) {
  return (
    <section className="border-2 border-[#151515] bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between border-b-2 border-[#151515] pb-2">
        <h3 className="text-lg font-black tracking-tight">{title}</h3>
        <Link
          className="text-sm font-bold text-[#151515] underline decoration-[#f05a28] decoration-2 underline-offset-4"
          href={href}
        >
          Full table
        </Link>
      </div>
      <table className="w-full text-left text-[14px]">
        <thead className="text-xs uppercase tracking-wide text-[#69645d]">
          <tr>
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Athlete</th>
            <th className="py-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d8d1c5]">
          {rows.map((row) => (
            <tr key={row.athleteId}>
              <td className="w-10 py-2 font-black tabular-nums">{row.rank}</td>
              <td className="py-2 pr-2 font-semibold">
                <AthleteLink athleteId={row.athleteId}>{row.athleteName}</AthleteLink>
              </td>
              <td className="py-2 text-right font-semibold tabular-nums">{row.totalPoints?.toFixed(1) ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ResultMiniTable({ title, rows }: { title: string; rows: ResultRow[] }) {
  return (
    <div>
      <h4 className="border-b border-[#f4f0e8]/30 pb-2 text-xs font-black uppercase tracking-wide text-[#cfc8bd]">
        {title}
      </h4>
      <table className="w-full text-left text-[14px]">
        <thead className="sr-only">
          <tr>
            <th>#</th>
            <th>Athlete</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f4f0e8]/20">
          {rows.map((row) => (
            <tr key={`${title}-${row.rankGender ?? row.rankOverall}-${row.name}`}>
              <td className="w-8 py-2 font-black tabular-nums">{row.rankGender ?? row.rankOverall}</td>
              <td className="py-2 pr-2 font-semibold">
                <AthleteLink athleteId={row.athleteId}>
                  {row.name}
                </AthleteLink>
              </td>
              <td className="w-20 py-2 text-right font-mono font-semibold tabular-nums">
                {row.chiptime ?? row.time ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid gap-2 p-5 sm:grid-cols-[10rem_1fr]">
      <h4 className="text-sm font-black uppercase tracking-wide">{title}</h4>
      <p className="text-sm font-semibold leading-6 text-[#4f4a44]">{text}</p>
    </div>
  );
}

function AthleteLink({
  athleteId,
  children,
}: {
  athleteId: string | null;
  children: React.ReactNode;
}) {
  if (!athleteId) return <span>{children}</span>;
  const athlete = ircData.athletes.find((entry) => entry.id === athleteId || entry.slug === athleteId);
  return (
    <Link className="underline-offset-4 hover:underline" href={`/athletes/${athlete?.slug ?? athleteId}`}>
      {children}
    </Link>
  );
}
