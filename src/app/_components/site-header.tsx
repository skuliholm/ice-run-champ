import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[#151515] bg-[#f4f0e8]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center bg-[#f05a28] text-[13px] font-black tracking-tight text-[#151515]">
            IRC
          </span>
          <span>
            <span className="block text-base font-black tracking-tight text-[#151515]">
              Icelandic Running Championships
            </span>
            <span className="block text-sm font-semibold text-[#69645d]">2026 rankings</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-[#151515] md:flex">
          <Link className="underline-offset-4 hover:underline" href="/standings">
            Standings
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/races">
            Races
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/athletes">
            Athletes
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/elo">
            Elo
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/methodology">
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
