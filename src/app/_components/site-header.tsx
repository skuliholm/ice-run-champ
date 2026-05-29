import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded bg-emerald-700 text-sm font-bold text-white">
            IRC
          </span>
          <span>
            <span className="block text-base font-semibold text-slate-950">
              Icelandic Running Championships
            </span>
            <span className="block text-sm text-slate-500">Prototype standings, 2026</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
          <Link className="hover:text-emerald-700" href="/#standings">
            Standings
          </Link>
          <Link className="hover:text-emerald-700" href="/#races">
            Races
          </Link>
          <Link className="hover:text-emerald-700" href="/methodology">
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
