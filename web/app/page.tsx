"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BetCard } from "@/components/BetCard";
import { FeatureCard } from "@/components/FeatureCard";
import { SectionHeader, SubSection } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { api, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Bet } from "@/lib/types";

type Scope = "open" | "mine" | "history";

export default function HomePage() {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("open");
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasToken(!!getToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!hasToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<Bet[]>(`/bets?scope=${scope}`)
      .then(setBets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scope, hasToken, mounted]);

  if (!mounted) {
    return <p className="section-label text-zinc-500">Booting…</p>;
  }

  if (!hasToken) {
    return <MarketingHome onStart={() => router.push("/login")} />;
  }

  return (
    <div className="space-y-12">
      <SectionHeader
        index="01 / FEED"
        title="Pick a fight."
        tagline="Open bets across the marketplace. Stake, take, and settle. Winner takes the pot."
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LiquidButton size="lg" onClick={() => router.push("/bets/new")}>
            + Post a bet
          </LiquidButton>
          <div className="flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
            {(["open", "mine", "history"] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "section-label rounded-full px-3 py-1.5 capitalize transition-colors",
                  scope === s
                    ? "bg-foreground text-background"
                    : "text-zinc-400 hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </SectionHeader>

      {error && (
        <div className="rounded-none border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="section-label text-zinc-500">Loading…</p>
      ) : bets.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <div className="section-label text-zinc-500">Nothing here</div>
          <div className="display-tight mt-3 text-2xl text-foreground">
            No bets in this view.
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Be the first — post a bet and let the marketplace come to you.
          </p>
        </div>
      ) : (
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {bets.map((b, i) => (
            <BetCard key={b.id} bet={b} index={String(i + 1).padStart(2, "0")} />
          ))}
        </div>
      )}
    </div>
  );
}

function MarketingHome({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-24">
      <section className="-mx-6 -mt-12 px-6 pt-16 sm:-mx-10 sm:px-10 sm:pt-24">
        <div className="section-label text-emerald-500">SKILLFUL / 26</div>
        <h1 className="display mt-6 text-[clamp(3.5rem,11vw,9rem)] text-foreground">
          The
          <br />
          Skill
          <br />
          <span className="text-emerald-500">Era.</span>
        </h1>
        <p className="mt-10 max-w-xl text-lg text-zinc-300">
          A marketplace for skill-based bets. $1,000 starting bankroll.
          Daily streaks. Eight power-ups. One leaderboard.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <LiquidButton size="xl" onClick={onStart}>
            Pick a username →
          </LiquidButton>
          <a
            href="#how-it-works"
            className="section-label text-zinc-400 hover:text-foreground"
          >
            How it works
          </a>
        </div>

        <figure className="mt-20 max-w-2xl border-l-2 border-emerald-500 pl-5">
          <blockquote className="text-balance text-xl italic text-zinc-200">
            &ldquo;The marketplace doesn&apos;t care about luck. It rewards
            people who can actually deliver.&rdquo;
          </blockquote>
          <figcaption className="section-label mt-3 text-zinc-500">
            <span className="text-zinc-300">SKILLFUL</span>
            <span className="mx-2 text-zinc-600">·</span>
            HOUSE PHILOSOPHY
          </figcaption>
        </figure>
      </section>

      <SectionHeader
        index="01 / THE GAME"
        title="Bet on yourself."
        tagline="Skillful is a head-to-head betting marketplace running on virtual currency. New users start with $1,000. Win, and the pot is yours."
      />

      <div id="how-it-works" className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          index="01/A"
          title="Post a bet"
          description="Title, description, and stake. The stake gets escrowed from your balance the moment you post."
        />
        <FeatureCard
          index="01/B"
          title="Accept a bet"
          description="Match someone's stake from the open feed. Pot is now 2× the stake — winner takes all."
        />
        <FeatureCard
          index="01/C"
          title="Settle mutually"
          description="Both sides claim a winner. If you agree, payout is automatic. If you disagree, an admin resolves."
        />
        <FeatureCard
          index="01/D"
          title="Daily streak"
          description="Log in daily and earn $50 base + $10 per consecutive day, up to a 7-day streak."
        />
        <FeatureCard
          index="01/E"
          title="Audit log"
          description="Every dollar moved is in your transactions feed. Append-only. No surprises, ever."
        />
        <FeatureCard
          index="01/F"
          title="Leaderboard"
          description="W/L records are public via Scout Reports. Build a reputation. Charge a premium."
        />
      </div>

      <SubSection
        index="02 / POWER-UPS"
        title="Eight ways to tilt the table."
        description="The shop sells consumable and permanent power-ups. Spend your winnings here."
      >
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            index="02/A"
            title="Lucky Charm"
            description="+10% winnings on your next win. Stackable up to 3."
          />
          <FeatureCard
            index="02/B"
            title="Insurance Policy"
            description="Refund 50% of stake on your next loss. One-shot."
          />
          <FeatureCard
            index="02/C"
            title="Scout Report"
            description="Reveal an opponent's W/L record before accepting their bet."
          />
          <FeatureCard
            index="02/D"
            title="Streak Freeze"
            description="Preserve your daily streak through one missed day."
          />
          <FeatureCard
            index="02/E"
            title="Double-or-Nothing"
            description="Offer to double the stake mid-bet. Spice things up."
          />
          <FeatureCard
            index="02/F"
            title="Whale License"
            description="Permanent. Raises your stake cap from $500 to $5,000."
          />
          <FeatureCard
            index="02/G"
            title="House Edge Coupon"
            description="Tiebreaks resolve in your favor on disputed bets."
          />
          <FeatureCard
            index="02/H"
            title="XP Boost"
            description="2× XP on your next 3 bets. Climb the ranks faster."
          />
        </div>
      </SubSection>

      <SubSection
        index="03 / ECONOMY"
        title="One marketplace. Real consequences."
        description="Money moves only inside the bet engine. Every adjustment writes to the audit log in the same DB transaction."
      >
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-3">
          <FeatureCard
            index="03/A"
            title="$1,000 starting"
            description="Every new user gets exactly $1,000 of virtual currency. No top-ups."
          />
          <FeatureCard
            index="03/B"
            title="Integer cents"
            description="All balances tracked as integer cents. Never floats. Never rounding errors."
          />
          <FeatureCard
            index="03/C"
            title="Mutual + admin"
            description="Most bets resolve in seconds. Disputes get admin review with full claim history."
          />
        </div>
      </SubSection>

      <section className="border-t border-border pt-16 text-center">
        <div className="section-label text-emerald-500">/ Step in</div>
        <h2 className="display mt-4 text-5xl text-foreground sm:text-7xl">
          Your move.
        </h2>
        <div className="mt-8 flex justify-center">
          <LiquidButton size="xl" onClick={onStart}>
            Pick a username →
          </LiquidButton>
        </div>
      </section>
    </div>
  );
}
