import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Icelandic Running Championships",
  description: "Icelandic running rankings, race results, Elo ratings, and methodology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#f4f0e8] text-[#151515]">{children}</body>
    </html>
  );
}
