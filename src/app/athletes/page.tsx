import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { formatGenderCategory, ircData } from "@/lib/irc-data";

export default function AthletesPage() {
  const rankedIds = new Set([
    ...ircData.menStandings.map((row) => row.athleteId),
    ...ircData.womenStandings.map((row) => row.athleteId),
  ]);
  const athletes = [...ircData.athletes].sort((a, b) => {
    const aRanked = rankedIds.has(a.id) ? 0 : 1;
    const bRanked = rankedIds.has(b.id) ? 0 : 1;
    return aRanked - bRanked || a.fullName.localeCompare(b.fullName);
  });

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wide">2026 season</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">Athletes</h1>
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
                    <th className="py-2 pr-3">Athlete</th>
                    <th className="py-2 pr-3">Club</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 text-right">Born</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d1c5]">
                  {athletes.map((athlete) => (
                    <tr key={athlete.id}>
                      <td className="py-2 pr-3 font-semibold">
                        <Link className="underline-offset-4 hover:underline" href={`/athletes/${athlete.slug}`}>
                          {athlete.fullName}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-[#69645d]">{athlete.club ?? "Unattached"}</td>
                      <td className="py-2 pr-3 font-semibold">{formatGenderCategory(athlete.genderCategory)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{athlete.birthYear}</td>
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
