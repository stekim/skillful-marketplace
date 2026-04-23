"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BetCard } from "@/components/BetCard";
import { api, getToken } from "@/lib/api";
import type { Bet } from "@/lib/types";

type Scope = "open" | "mine" | "history";

export default function HomePage() {
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
    return <p className="text-zinc-500">Loading…</p>;
  }

  if (!hasToken) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-2xl font-semibold">Welcome to Skillful</h1>
        <p className="mt-2 text-zinc-400">
          Post bets. Take bets. Start with $1000 in virtual currency, earn more
          with daily logins and wins, and spend it in the shop.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400"
        >
          Pick a username to start
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bets</h1>
        <Link
          href="/bets/new"
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
        >
          + New Bet
        </Link>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        {(["open", "mine", "history"] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`rounded-md px-3 py-1 capitalize transition ${
              scope === s
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : bets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
          No bets here yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {bets.map((b) => (
            <BetCard key={b.id} bet={b} />
          ))}
        </div>
      )}
    </div>
  );
}
