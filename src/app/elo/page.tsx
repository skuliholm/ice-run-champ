import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { ircData } from "@/lib/irc-data";

export default function EloPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wide">2026 season</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">Elo</h1>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="border-2 border-[#151515] bg-white p-5">
            <div className="mb-3 border-b-2 border-[#151515] pb-2">
              <h2 className="text-lg font-black tracking-tight">Full list</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="text-xs uppercase tracking-wide text-[#69645d]">
                  <tr>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Athlete</th>
                    <th className="py-2 pr-3">Club</th>
                    <th className="py-2 pr-3 text-right">Races</th>
                    <th className="py-2 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d1c5]">
                  {ircData.eloRankings.map((row) => {
                    const athlete = ircData.athletes.find((entry) => entry.id === row.athleteId);
                    return (
                      <tr key={row.athleteId}>
                        <td className="w-10 py-2 pr-3 font-black tabular-nums">{row.rank}</td>
                        <td className="py-2 pr-3 font-semibold">
                          <Link className="underline-offset-4 hover:underline" href={`/athletes/${athlete?.slug ?? row.athleteId}`}>
                            {row.athleteName}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-[#69645d]">{row.club ?? "Unattached"}</td>
                        <td className="py-2 pr-3 text-right font-semibold tabular-nums">{row.racesCount}</td>
                        <td className="py-2 text-right font-mono font-semibold tabular-nums">{row.rating.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
