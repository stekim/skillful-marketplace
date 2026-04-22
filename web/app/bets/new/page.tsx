"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">Create a bet</h1>
      {user && (
        <p className="mt-1 text-sm text-zinc-400">
          Your balance: {formatCents(user.balance_cents)}
        </p>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Title</label>
          <input
            required
            minLength={3}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="I can name every country in Africa in 2 minutes"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Description
          </label>
          <textarea
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rules, conditions, how the winner is decided…"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Stake: <span className="font-mono text-emerald-300">${stakeDollars}</span>
          </label>
          <input
            type="range"
            min={1}
            max={Math.min(500, Math.floor((user?.balance_cents ?? 100000) / 100))}
            step={1}
            value={stakeDollars}
            onChange={(e) => setStakeDollars(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Both sides put up this amount. Winner takes both. Cap is $500 without a
            Whale License.
          </p>
        </div>
        <button
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "…" : "Post bet"}
        </button>
        {error && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-300">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
