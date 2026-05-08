import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { Header } from "@/components/Header";
import { Marquee } from "@/components/Marquee";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Skillful / 26",
  description:
    "Skillful Marketplace — post bets, take bets, climb the leaderboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background bg-grain text-foreground antialiased">
        <Analytics />
        <Marquee />
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
          {children}
        </main>
        <footer className="mx-auto mt-24 max-w-6xl border-t border-border px-6 py-10 text-xs text-zinc-500 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="display text-3xl text-foreground">Skillful</div>
              <div className="section-label mt-1">/ Sprint 26</div>
            </div>
            <div className="text-right">
              <div className="section-label">Marketplace OS</div>
              <div className="mt-1 text-zinc-500">
                Built for skill, not luck.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
