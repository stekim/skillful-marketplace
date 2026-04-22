"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { formatCents, formatDate } from "@/lib/format";
import type { Bet, Claim } from "@/lib/types";

export default function AdminPage() {
  const [disputes, setDisputes] = useState<Bet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setDisputes(await api<Bet[]>("/admin/disputes"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(bet: Bet, winner: Claim) {
    setBusy(bet.id);
    setError(null);
    try {
      await api(`/admin/bets/${bet.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ winner }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Disputes</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Bets where the two participants disagreed on the winner.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {disputes.length === 0 ? (
          <p className="text-zinc-500">No disputes to resolve.</p>
        ) : (
          disputes.map((b) => (
            <div
              key={b.id}
              className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{b.title}</div>
                  {b.description && (
                    <p className="mt-1 text-sm text-zinc-300">{b.description}</p>
                  )}
                  <div className="mt-2 text-xs text-zinc-400">
                    @{b.creator_username} (claim: {b.creator_claim ?? "—"}) vs @
                    {b.opponent_username} (claim: {b.opponent_claim ?? "—"})
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    Stake {formatCents(b.stake_cents)} each · created{" "}
                    {formatDate(b.created_at)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {(["creator_wins", "opponent_wins", "draw"] as Claim[]).map(
                    (c) => (
                      <button
                        key={c}
                        disabled={busy === b.id}
                        onClick={() => resolve(b, c)}
                        className="rounded-md border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {c.replace("_", " ")}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
