"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { api } from "@/lib/api";
import { formatCents } from "@/lib/format";
import type { Bet, User } from "@/lib/types";

export default function NewBetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stakeDollars, setStakeDollars] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<User>("/me").then(setUser).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const bet = await api<Bet>("/bets", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          stake_cents: Math.round(stakeDollars * 100),
        }),
      });
      router.push(`/bets/${bet.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create bet");
    } finally {
      setLoading(false);
    }
  }

  const maxStake = Math.min(
    500,
    Math.floor((user?.balance_cents ?? 100000) / 100),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader
        index="02 / NEW BET"
        title="Set the terms."
        tagline="Title, the rules, and how much you're staking. Your stake is escrowed the moment you post — pot doubles when someone accepts."
      />

      {user && (
        <div className="mt-8 flex items-baseline justify-between border border-border bg-secondary/30 px-5 py-3">
          <span className="section-label text-zinc-500">Your bankroll</span>
          <span className="font-mono text-emerald-400">
            {formatCents(user.balance_cents)}
          </span>
        </div>
      )}

      <form
        onSubmit={submit}
        className="mt-6 space-y-8 border border-border bg-secondary/20 p-8"
      >
        <div>
          <label className="section-label block text-zinc-400">
            02/A · Title
          </label>
          <input
            required
            minLength={3}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="I can name every country in Africa in 2 minutes"
            className="display-tight mt-3 w-full border-0 border-b border-border bg-transparent pb-3 text-2xl text-foreground placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="section-label block text-zinc-400">
            02/B · Description
          </label>
          <textarea
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rules, conditions, how the winner is decided…"
            className="mt-3 w-full border border-border bg-background px-4 py-3 text-foreground placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="section-label block text-zinc-400">
            02/C · Stake
          </label>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="display text-5xl text-foreground">
              ${stakeDollars}
            </span>
            <span className="section-label text-zinc-500">each side</span>
          </div>
          <input
            type="range"
            min={1}
            max={maxStake}
            step={1}
            value={stakeDollars}
            onChange={(e) => setStakeDollars(Number(e.target.value))}
            className="mt-4 w-full accent-emerald-500"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Both sides put up this amount. Winner takes both. Cap is $500
            without a Whale License.
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-6">
          <LiquidButton type="submit" disabled={loading} size="lg">
            {loading ? "…" : "Post bet →"}
          </LiquidButton>
          <span className="section-label text-zinc-500">
            Pot will be {formatCents(stakeDollars * 100 * 2)}
          </span>
        </div>

        {error && (
          <div className="border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
