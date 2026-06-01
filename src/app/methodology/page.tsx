import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-[#151515] bg-[#f05a28] text-[#151515]">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <p className="text-xs font-black uppercase tracking-wide">Full method</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-[-0.065em] md:text-6xl">
              Methodology
            </h1>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="border-2 border-[#151515] bg-[#f4f0e8] p-5">
            <div className="border-b-2 border-[#151515] pb-3">
              <h2 className="text-lg font-black tracking-tight">Tables</h2>
            </div>
            <nav className="mt-4 grid gap-3 text-sm font-black uppercase tracking-wide">
              <Link className="underline decoration-[#f05a28] decoration-2 underline-offset-4" href="/standings">
                Standings
              </Link>
              <Link className="underline decoration-[#f05a28] decoration-2 underline-offset-4" href="/elo">
                Elo
              </Link>
              <Link className="underline decoration-[#f05a28] decoration-2 underline-offset-4" href="/races">
                Results
              </Link>
            </nav>
          </aside>

          <article className="border-2 border-[#151515] bg-white">
            <MethodSection
              title="Standings"
              text="Season points come from eligible race results. Men and women are ranked separately, and the best results count toward the championship table."
            />
            <MethodSection
              title="Elo"
              text="Ratings update after races using field strength, placing, and head-to-head outcomes. Elo is a form guide for the full field."
            />
            <MethodSection
              title="Sources"
              text="Race results are linked to published timing sources where available. The source result is the record for athlete names, placings, and times."
            />
            <MethodSection
              title="Status"
              text="Final results are included in the main tables. Provisional rows may appear while a season table is still being completed."
            />
          </article>
        </section>
      </main>
    </>
  );
}

function MethodSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="grid gap-3 border-b-2 border-[#151515] p-5 last:border-b-0 md:grid-cols-[12rem_1fr]">
      <h2 className="text-lg font-black tracking-tight">{title}</h2>
      <p className="max-w-3xl text-base font-semibold leading-7 text-[#4f4a44]">{text}</p>
    </section>
  );
}
