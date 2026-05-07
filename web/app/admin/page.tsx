"use client";

import { useCallback, useEffect, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
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
    <div className="space-y-10">
      <SectionHeader
        index="00 / ADMIN"
        title="Resolve disputes."
        tagline="Bets where the two participants disagreed on the outcome. Read the claims, pick the truth, the engine pays out."
        quote={{
          text: "We let users self-resolve 95% of the time. The other 5% lands here.",
          author: "House Rules",
          role: "Mutual resolution policy",
        }}
      />

      {error && (
        <div className="border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="space-y-px bg-border">
        {disputes.length === 0 ? (
          <div className="border border-dashed border-border bg-background p-10 text-center">
            <div className="section-label text-zinc-500">All clear</div>
            <div className="display-tight mt-3 text-2xl text-foreground">
              No disputes to resolve.
            </div>
          </div>
        ) : (
          disputes.map((b, i) => (
            <div key={b.id} className="bg-background p-6">
              <div className="flex items-start justify-between">
                <span className="section-label text-rose-400">
                  00/{String(i + 1).padStart(2, "0")} · DISPUTED
                </span>
                <span className="section-label text-zinc-500">
                  Stake {formatCents(b.stake_cents)} · {formatDate(b.created_at)}
                </span>
              </div>
              <h3 className="display-tight mt-4 text-2xl text-foreground">
                {b.title}
              </h3>
              {b.description && (
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  {b.description}
                </p>
              )}
              <div className="mt-5 grid gap-px bg-border border border-border sm:grid-cols-2">
                <div className="bg-background p-4">
                  <div className="section-label text-zinc-500">Creator</div>
                  <div className="mt-2 text-foreground">
                    @{b.creator_username}
                  </div>
                  <div className="mt-1 font-mono text-xs text-zinc-400">
                    claim: {b.creator_claim ?? "—"}
                  </div>
                </div>
                <div className="bg-background p-4">
                  <div className="section-label text-zinc-500">Opponent</div>
                  <div className="mt-2 text-foreground">
                    @{b.opponent_username ?? "—"}
                  </div>
                  <div className="mt-1 font-mono text-xs text-zinc-400">
                    claim: {b.opponent_claim ?? "—"}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <span className="section-label text-zinc-500">
                  Resolve as
                </span>
                {(["creator_wins", "opponent_wins", "draw"] as Claim[]).map(
                  (c) => (
                    <LiquidButton
                      key={c}
                      disabled={busy === b.id}
                      onClick={() => resolve(b, c)}
                      size="default"
                    >
                      {c.replace("_", " ")}
                    </LiquidButton>
                  ),
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
