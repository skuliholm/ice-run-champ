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
        "inline-flex items-center border border-[#151515] px-2 py-1 text-xs font-black uppercase tracking-wide",
        tone === "emerald" && "bg-[#f05a28] text-[#151515]",
        tone === "amber" && "bg-[#f4f0e8] text-[#151515]",
        tone === "blue" && "bg-white text-[#151515]",
        tone === "slate" && "bg-[#151515] text-[#f4f0e8]",
      )}
    >
      {children}
    </span>
  );
}
