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

export function generateStaticParams() {
  return ircData.athletes.map((athlete) => ({ slug: athlete.slug }));
}

export default async function AthletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const liveAthlete = await getLiveAthleteDetail(slug);
  if (liveAthlete) return <LiveAthletePage athlete={liveAthlete} />;

  const athlete = getAthleteBySlug(slug);
  if (!athlete) notFound();

  const results = getAthleteResults(athlete.id);
  const standing = getAthleteStanding(athlete.id);
  const elo = getAthleteElo(athlete.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Back to standings
          </Link>
        </div>
        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded border border-slate-200 bg-white p-6">
            <h1 className="text-3xl font-semibold">{athlete.fullName}</h1>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <AthleteMetric label="Club" value={athlete.club ?? "Unattached"} />
              <AthleteMetric label="Born" value={String(athlete.birthYear)} />
              <AthleteMetric label="Champ rank" value={standing ? String(standing.rank) : "-"} />
              <AthleteMetric label="Elo rank" value={elo ? String(elo.rank) : "-"} />
              <AthleteMetric label="Points" value={standing ? standing.totalPoints.toFixed(1) : "-"} />
              <AthleteMetric label="Elo" value={elo ? elo.rating.toFixed(0) : "-"} />
            </dl>
          </div>
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-semibold">Race History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Race</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3 text-right">Rank</th>
                    <th className="px-4 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map(({ race, result }) => (
                    <tr key={race.id}>
                      <td className="px-4 py-3 text-slate-600">{formatDate(race.event.date)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/races/${race.id}`} className="font-medium hover:text-emerald-700">
                          {race.event.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRaceDistance(race.distanceMeters)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{result.rankOverall}</td>
                      <td className="px-4 py-3 text-right font-mono">{result.chiptime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

type LiveAthletePageProps = {
  athlete: NonNullable<Awaited<ReturnType<typeof getLiveAthleteDetail>>>;
};

function LiveAthletePage({ athlete }: LiveAthletePageProps) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Back to standings
          </Link>
        </div>
        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold text-emerald-700">Live Supabase profile</p>
            <h1 className="mt-2 text-3xl font-semibold">{athlete.fullName}</h1>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <AthleteMetric label="Club" value={athlete.club ?? "Unattached"} />
              <AthleteMetric label="Born" value={athlete.birthYear == null ? "-" : String(athlete.birthYear)} />
              <AthleteMetric label="Category" value={formatGenderCategory(athlete.gender ?? "unknown")} />
              <AthleteMetric label="Races" value={String(athlete.racesCount)} />
              <AthleteMetric label="Best rank" value={athlete.bestRank == null ? "-" : String(athlete.bestRank)} />
              <AthleteMetric label="Points" value={athlete.totalPoints.toFixed(1)} />
            </dl>
          </div>
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-semibold">Race History</h2>
            </div>
            {athlete.results.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Race</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Cat</th>
                      <th className="px-4 py-3 text-right">Rank</th>
                      <th className="px-4 py-3 text-right">Cat rank</th>
                      <th className="px-4 py-3 text-right">Time</th>
                      <th className="px-4 py-3 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {athlete.results.map((result) => (
                      <tr key={`${athlete.id}-${result.raceId}-${result.rankOverall}`}>
                        <td className="px-4 py-3 text-slate-600">
                          {result.date ? formatDate(result.date) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {result.raceId ? (
                            <Link href={`/races/${result.raceId}`} className="font-medium hover:text-emerald-700">
                              {result.eventName}
                            </Link>
                          ) : (
                            <span className="font-medium">{result.eventName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatOptionalRaceDistance(result.distanceMeters, result.distanceLabel)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatGenderCategory(result.genderCategory)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{result.rankOverall ?? "-"}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{result.rankGender ?? "-"}</td>
                        <td className="px-4 py-3 text-right font-mono">{result.time ?? "-"}</td>
                        <td className="px-4 py-3 text-right font-mono">{result.points.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-600">
                No imported results are linked to this athlete yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function AthleteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-2 text-base font-semibold">{value}</dd>
    </div>
  );
}
