import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";
import { ircData } from "@/lib/irc-data";

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Back to standings
          </Link>
        </div>
        <article className="rounded border border-slate-200 bg-white p-6">
          <h1 className="text-3xl font-semibold">Methodology</h1>
          <div className="mt-6 space-y-6 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-950">Data</h2>
              <p className="mt-2 leading-7">
                Puffin Run 2026 is imported from Timataka and preserved with the original source URL.
                The other races in this prototype are generated from that athlete pool and marked as
                mock data throughout the UI.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-950">Championship</h2>
              <p className="mt-2 leading-7">{ircData.methodology.championship}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-950">Elo</h2>
              <p className="mt-2 leading-7">{ircData.methodology.elo}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-950">Current Limits</h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 leading-7">
                <li>Rules are provisional and intended to shape V1 product decisions.</li>
                <li>Men&apos;s and women&apos;s categories come from Timataka category pages for now.</li>
                <li>Age groups, broader eligibility rules, and non-binary/open-category handling are not finalized.</li>
                <li>Generated races are development data, not public championship results.</li>
                <li>Supabase write flows are still service-role only and not connected to the UI yet.</li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
