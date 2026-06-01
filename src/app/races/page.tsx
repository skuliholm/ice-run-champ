import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { formatDate, formatOptionalRaceDistance, formatRaceDistance, ircData } from "@/lib/irc-data";
import { getLiveRaceCalendar } from "@/lib/supabase-data";

export default async function RacesPage() {
  const liveRaces = await getLiveRaceCalendar();
  const races = liveRaces.length
    ? liveRaces.map((race) => ({
        id: race.id,
        eventName: race.eventName,
        date: race.date,
        distance: formatOptionalRaceDistance(race.distanceMeters, race.distanceLabel),
        tier: race.raceTier,
        sourceUrl: race.sourceUrl,
        status: race.importStatus === "imported" ? "Final" : "Scheduled",
      }))
    : ircData.races.map((race) => ({
        id: race.id,
        eventName: race.event.name,
        date: race.event.date,
        distance: formatRaceDistance(race.distanceMeters),
        tier: race.raceTier,
        sourceUrl: race.sourceUrl,
        status: race.isMock ? "Provisional" : "Final",
      }));

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wide">2026 season</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">Races</h1>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="border-2 border-[#151515] bg-white p-5">
            <div className="mb-3 border-b-2 border-[#151515] pb-2">
              <h2 className="text-lg font-black tracking-tight">Results calendar</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="text-xs uppercase tracking-wide text-[#69645d]">
                  <tr>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Race</th>
                    <th className="py-2 pr-3">Distance</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d1c5]">
                  {races.map((race) => (
                    <tr key={race.id}>
                      <td className="py-2 pr-3 font-semibold tabular-nums">{formatDate(race.date)}</td>
                      <td className="py-2 pr-3 font-semibold">
                        <Link className="underline-offset-4 hover:underline" href={`/races/${race.id}`}>
                          {race.eventName}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-[#69645d]">{race.distance}</td>
                      <td className="py-2 pr-3 font-semibold uppercase">{race.tier}</td>
                      <td className="py-2 pr-3 font-semibold">{race.status}</td>
                      <td className="py-2 text-right">
                        {race.sourceUrl ? (
                          <a className="font-bold underline decoration-[#f05a28] decoration-2 underline-offset-4" href={race.sourceUrl} rel="noreferrer" target="_blank">
                            Source
                          </a>
                        ) : (
                          <span className="text-[#69645d]">-</span>
                        )}
                      </td>
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
