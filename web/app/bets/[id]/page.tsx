"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
    return <p className="text-rose-300">{error}</p>;
  }
  if (!bet || !me) return <p className="text-zinc-500">Loading…</p>;

  const isCreator = me.id === bet.creator_id;
  const isOpponent = me.id === bet.opponent_id;
  const isParticipant = isCreator || isOpponent;
  const myClaim = isCreator ? bet.creator_claim : isOpponent ? bet.opponent_claim : null;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-zinc-400 hover:text-zinc-200"
      >
        ← Back
      </button>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{bet.title}</h1>
          <span
            className={`rounded-md border px-2 py-1 text-xs ${statusColor(bet.status)}`}
          >
            {bet.status}
          </span>
        </div>
        {bet.description && (
          <p className="mt-3 whitespace-pre-wrap text-zinc-300">{bet.description}</p>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-zinc-500">Creator</dt>
            <dd className="font-medium">@{bet.creator_username}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Opponent</dt>
            <dd className="font-medium">
              {bet.opponent_username ? `@${bet.opponent_username}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Stake (each)</dt>
            <dd className="font-mono text-emerald-300">
              {formatCents(bet.stake_cents)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Pot</dt>
            <dd className="font-mono text-emerald-300">
              {formatCents(bet.stake_cents * 2)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Created</dt>
            <dd>{formatDate(bet.created_at)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Resolved</dt>
            <dd>{formatDate(bet.resolved_at)}</dd>
          </div>
          {bet.status === "resolved" && (
            <div className="col-span-2">
              <dt className="text-zinc-500">Winner</dt>
              <dd className="font-medium">
                {bet.winner_id === null
                  ? "Draw"
                  : bet.winner_id === bet.creator_id
                    ? `@${bet.creator_username}`
                    : `@${bet.opponent_username}`}{" "}
                <span className="text-xs text-zinc-500">
                  (by {bet.resolved_by})
                </span>
              </dd>
            </div>
          )}
          {(bet.creator_claim || bet.opponent_claim) && (
            <div className="col-span-2">
              <dt className="text-zinc-500">Claims</dt>
              <dd className="text-sm">
                creator: <span className="font-mono">{bet.creator_claim ?? "—"}</span>
                {"  /  "}
                opponent:{" "}
                <span className="font-mono">{bet.opponent_claim ?? "—"}</span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {bet.status === "open" && !isCreator && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                act(() => api(`/bets/${bet.id}/accept`, { method: "POST" }))
              }
              className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              Accept bet ({formatCents(bet.stake_cents)})
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const r = await api<ScoutReport>(`/bets/${bet.id}/scout`, {
                    method: "POST",
                  });
                  setScout(r);
                })
              }
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              Use Scout Report
            </button>
          </>
        )}

        {bet.status === "open" && isCreator && (
          <button
            disabled={busy}
            onClick={() =>
              act(() => api(`/bets/${bet.id}/cancel`, { method: "POST" }))
            }
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel bet (refund stake)
          </button>
        )}

        {isParticipant &&
          (bet.status === "active" || bet.status === "pending_resolution") &&
          !myClaim && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Claim winner:</span>
              {(["creator_wins", "opponent_wins", "draw"] as Claim[]).map((c) => (
                <button
                  key={c}
                  disabled={busy}
                  onClick={() =>
                    act(() =>
                      api(`/bets/${bet.id}/claim-winner`, {
                        method: "POST",
                        body: JSON.stringify({ claim: c }),
                      }),
                    )
                  }
                  className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  {c.replace("_", " ")}
                </button>
              ))}
            </div>
          )}

        {myClaim && bet.status !== "resolved" && (
          <span className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
            Your claim submitted: {myClaim}
          </span>
        )}
      </div>

      {scout && (
        <div className="mt-6 rounded-lg border border-sky-500/30 bg-sky-500/5 p-4 text-sm">
          <div className="mb-1 font-medium text-sky-200">
            Scout Report — @{scout.username}
          </div>
          <div className="text-zinc-300">
            {scout.wins}W / {scout.losses}L / {scout.draws}D across {scout.total_bets}{" "}
            resolved bets. Avg stake:{" "}
            <span className="font-mono">{formatCents(scout.avg_stake_cents)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
