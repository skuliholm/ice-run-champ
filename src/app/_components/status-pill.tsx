import { classNames } from "@/lib/irc-data";

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "amber" | "blue" | "slate";
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded px-2 py-1 text-xs font-semibold",
        tone === "emerald" && "bg-emerald-100 text-emerald-800",
        tone === "amber" && "bg-amber-100 text-amber-800",
        tone === "blue" && "bg-sky-100 text-sky-800",
        tone === "slate" && "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}
