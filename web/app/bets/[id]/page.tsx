"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { track } from "@/lib/analytics";
import { api } from "@/lib/api";
import { formatCents, formatDate, statusColor } from "@/lib/format";
import type { Bet, Claim, ScoutReport, User } from "@/lib/types";

export default function BetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [bet, setBet] = useState<Bet | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scout, setScout] = useState<ScoutReport | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, u] = await Promise.all([
        api<Bet>(`/bets/${id}`),
        api<User>("/me"),
      ]);
      setBet(b);
      setMe(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act<T>(fn: () => Promise<T>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !bet) {
    return (
      <div className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
        {error}
      </div>
    );
  }
  if (!bet || !me)
    return <p className="section-label text-zinc-500">Loading…</p>;

  const isCreator = me.id === bet.creator_id;
  const isOpponent = me.id === bet.opponent_id;
  const isParticipant = isCreator || isOpponent;
  const myClaim = isCreator
    ? bet.creator_claim
    : isOpponent
      ? bet.opponent_claim
      : null;

  const idStr = String(bet.id).padStart(4, "0");

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <button
        onClick={() => router.back()}
        className="section-label text-zinc-500 transition-colors hover:text-foreground"
      >
        ← Back to feed
      </button>

      <SectionHeader
        index={`BET / #${idStr}`}
        title={bet.title}
        tagline={bet.description ?? undefined}
      >
        <div className="mt-6 inline-flex">
          <span
            className={`border px-3 py-1 text-[10px] uppercase tracking-widest ${statusColor(
              bet.status,
            )}`}
          >
            {bet.status.replace("_", " ")}
          </span>
        </div>
      </SectionHeader>

      <dl className="grid grid-cols-2 gap-px bg-border border border-border sm:grid-cols-3">
        <Cell label="Creator" value={`@${bet.creator_username}`} />
        <Cell
          label="Opponent"
          value={
            bet.opponent_username ? `@${bet.opponent_username}` : "—"
          }
        />
        <Cell
          label="Stake / side"
          value={formatCents(bet.stake_cents)}
          mono
          accent
        />
        <Cell
          label="Pot"
          value={formatCents(bet.stake_cents * 2)}
          mono
          accent
        />
        <Cell label="Created" value={formatDate(bet.created_at)} />
        <Cell label="Resolved" value={formatDate(bet.resolved_at)} />
        {bet.status === "resolved" && (
          <Cell
            label="Winner"
            value={
              bet.winner_id === null
                ? "Draw"
                : bet.winner_id === bet.creator_id
                  ? `@${bet.creator_username}`
                  : `@${bet.opponent_username}`
            }
            sub={`by ${bet.resolved_by}`}
          />
        )}
        {(bet.creator_claim || bet.opponent_claim) && (
          <Cell
            label="Claims"
            value={`${bet.creator_claim ?? "—"} / ${bet.opponent_claim ?? "—"}`}
            mono
          />
        )}
      </dl>

      {error && (
        <div className="border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="border-t border-border pt-8">
        <div className="section-label text-zinc-500">Actions</div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {bet.status === "open" && !isCreator && (
            <>
              <LiquidButton
                disabled={busy}
                size="lg"
                onClick={() =>
                  act(async () => {
                    await api(`/bets/${bet.id}/accept`, { method: "POST" });
                    track("bet_accepted", {
                      bet_id: bet.id,
                      stake_cents: bet.stake_cents,
                    });
                  })
                }
              >
                Accept ({formatCents(bet.stake_cents)}) →
              </LiquidButton>
              <LiquidButton
                disabled={busy}
                size="default"
                onClick={() =>
                  act(async () => {
                    const r = await api<ScoutReport>(`/bets/${bet.id}/scout`, {
                      method: "POST",
                    });
                    track("bet_scout_used", { bet_id: bet.id });
                    setScout(r);
                  })
                }
              >
                Scout opponent
              </LiquidButton>
            </>
          )}

          {bet.status === "open" && isCreator && (
            <LiquidButton
              disabled={busy}
              size="default"
              onClick={() =>
                act(async () => {
                  await api(`/bets/${bet.id}/cancel`, { method: "POST" });
                  track("bet_canceled", { bet_id: bet.id });
                })
              }
            >
              Cancel + refund stake
            </LiquidButton>
          )}

          {isParticipant &&
            (bet.status === "active" || bet.status === "pending_resolution") &&
            !myClaim && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="section-label text-zinc-400">
                  Claim winner
                </span>
                {(["creator_wins", "opponent_wins", "draw"] as Claim[]).map(
                  (c) => (
                    <LiquidButton
                      key={c}
                      disabled={busy}
                      size="default"
                      onClick={() =>
                        act(async () => {
                          await api(`/bets/${bet.id}/claim-winner`, {
                            method: "POST",
                            body: JSON.stringify({ claim: c }),
                          });
                          track("bet_claim_submitted", {
                            bet_id: bet.id,
                            claim: c,
                          });
                        })
                      }
                    >
                      {c.replace("_", " ")}
                    </LiquidButton>
                  ),
                )}
              </div>
            )}

          {myClaim && bet.status !== "resolved" && (
            <span className="border border-border px-3 py-2 text-sm text-zinc-300">
              Your claim:{" "}
              <span className="font-mono text-emerald-400">{myClaim}</span>
            </span>
          )}
        </div>
      </div>

      {scout && (
        <div className="border border-sky-500/40 bg-sky-500/10 p-5">
          <div className="section-label text-sky-300">
            Scout Report · @{scout.username}
          </div>
          <div className="display-tight mt-3 text-2xl text-foreground">
            {scout.wins}W / {scout.losses}L / {scout.draws}D
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            Across {scout.total_bets} resolved bets. Avg stake:{" "}
            <span className="font-mono text-sky-300">
              {formatCents(scout.avg_stake_cents)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  mono,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="bg-background p-5">
      <div className="section-label text-zinc-500">{label}</div>
      <div
        className={`mt-2 text-base ${mono ? "font-mono" : ""} ${
          accent ? "text-emerald-400" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-zinc-500">{sub}</div>
      )}
    </div>
  );
}
