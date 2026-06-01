import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/site-header";
import {
  formatDate,
  formatGenderCategory,
  formatOptionalRaceDistance,
  formatRaceDistance,
  getAthleteBySlug,
  getAthleteElo,
  getAthleteResults,
  getAthleteStanding,
  ircData,
} from "@/lib/irc-data";
import { getLiveAthleteDetail } from "@/lib/supabase-data";

type AthleteResultRow = {
  raceId: string;
  eventName: string;
  date: string;
  distance: string;
  category: string;
  rankOverall: number | null;
  rankGender: number | null;
  time: string | null;
  points?: number;
};

export function generateStaticParams() {
  return ircData.athletes.map((athlete) => ({ slug: athlete.slug }));
}

export default async function AthletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const liveAthlete = await getLiveAthleteDetail(slug);
  if (liveAthlete) {
    return (
      <AthleteDetail
        name={liveAthlete.fullName}
        club={liveAthlete.club}
        birthYear={liveAthlete.birthYear}
        category={formatGenderCategory(liveAthlete.gender ?? "unknown")}
        rank={null}
        elo={null}
        points={liveAthlete.totalPoints}
        racesCount={liveAthlete.racesCount}
        results={liveAthlete.results.map((result) => ({
          raceId: result.raceId,
          eventName: result.eventName,
          date: result.date,
          distance: formatOptionalRaceDistance(result.distanceMeters, result.distanceLabel),
          category: formatGenderCategory(result.genderCategory),
          rankOverall: result.rankOverall,
          rankGender: result.rankGender,
          time: result.time,
          points: result.points,
        }))}
      />
    );
  }

  const athlete = getAthleteBySlug(slug);
  if (!athlete) notFound();

  const standing = getAthleteStanding(athlete.id);
  const elo = getAthleteElo(athlete.id);
  const results = getAthleteResults(athlete.id).map(({ race, result }) => ({
    raceId: race.id,
    eventName: race.event.name,
    date: race.event.date,
    distance: formatRaceDistance(race.distanceMeters),
    category: formatGenderCategory(result.genderCategory),
    rankOverall: result.rankOverall,
    rankGender: result.rankGender,
    time: result.chiptime,
    points: standing ? Math.max(0, 101 - (result.rankGender ?? 101)) : undefined,
  }));

  return (
    <AthleteDetail
      name={athlete.fullName}
      club={athlete.club}
      birthYear={athlete.birthYear}
      category={formatGenderCategory(athlete.genderCategory)}
      rank={standing?.rank ?? null}
      elo={elo?.rating ?? null}
      points={standing?.totalPoints ?? null}
      racesCount={standing?.racesCount ?? results.length}
      results={results}
    />
  );
}

function AthleteDetail({
  name,
  club,
  birthYear,
  category,
  rank,
  elo,
  points,
  racesCount,
  results,
}: {
  name: string;
  club: string | null;
  birthYear: number | null;
  category: string;
  rank: number | null;
  elo: number | null;
  points: number | null;
  racesCount: number;
  results: AthleteResultRow[];
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wide">Athlete</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">{name}</h1>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="border-2 border-[#151515] bg-[#f4f0e8] p-5">
            <div className="border-b-2 border-[#151515] pb-3">
              <h2 className="text-lg font-black tracking-tight">Profile</h2>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <AthleteMetric label="Club" value={club ?? "Unattached"} />
              <AthleteMetric label="Born" value={birthYear == null ? "-" : String(birthYear)} />
              <AthleteMetric label="Category" value={category} />
              <AthleteMetric label="Races" value={String(racesCount)} />
              <AthleteMetric label="Rank" value={rank == null ? "-" : String(rank)} />
              <AthleteMetric label="Elo" value={elo == null ? "-" : elo.toFixed(0)} />
              <AthleteMetric label="Pts" value={points == null ? "-" : points.toFixed(1)} />
            </dl>
          </div>

          <section className="border-2 border-[#151515] bg-white p-5">
            <div className="mb-3 border-b-2 border-[#151515] pb-2">
              <h2 className="text-lg font-black tracking-tight">Race history</h2>
            </div>
            {results.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-xs uppercase tracking-wide text-[#69645d]">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Race</th>
                      <th className="py-2 pr-3">Distance</th>
                      <th className="py-2 pr-3">Cat</th>
                      <th className="py-2 pr-3 text-right">Rank</th>
                      <th className="py-2 pr-3 text-right">Cat #</th>
                      <th className="py-2 pr-3 text-right">Time</th>
                      <th className="py-2 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8d1c5]">
                    {results.map((result) => (
                      <tr key={`${result.raceId}-${result.rankOverall}-${result.eventName}`}>
                        <td className="py-2 pr-3 font-semibold tabular-nums">
                          {result.date ? formatDate(result.date) : "-"}
                        </td>
                        <td className="py-2 pr-3 font-semibold">
                          {result.raceId ? (
                            <Link className="underline-offset-4 hover:underline" href={`/races/${result.raceId}`}>
                              {result.eventName}
                            </Link>
                          ) : (
                            result.eventName
                          )}
                        </td>
                        <td className="py-2 pr-3 text-[#69645d]">{result.distance}</td>
                        <td className="py-2 pr-3 text-[#69645d]">{result.category}</td>
                        <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                          {result.rankOverall ?? "-"}
                        </td>
                        <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                          {result.rankGender ?? "-"}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono font-semibold tabular-nums">
                          {result.time ?? "-"}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums">
                          {result.points == null ? "-" : result.points.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-sm font-semibold text-[#69645d]">No results listed.</div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

function AthleteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#151515] bg-white p-3">
      <dt className="text-xs font-black uppercase tracking-wide text-[#69645d]">{label}</dt>
      <dd className="mt-2 text-base font-black tabular-nums">{value}</dd>
    </div>
  );
}
