"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { formatCents, formatDate } from "@/lib/format";
import type { DailyBonusResult, Transaction, User, UserItem } from "@/lib/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<UserItem[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [u, inv, tx] = await Promise.all([
      api<User>("/me"),
      api<UserItem[]>("/me/inventory"),
      api<Transaction[]>("/me/transactions"),
    ]);
    setUser(u);
    setInventory(inv);
    setTxs(tx);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function claimDaily() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const r = await api<DailyBonusResult>("/me/claim-daily", { method: "POST" });
      setMessage(r.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <p className="text-zinc-500">Loading…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const canClaim = user.last_daily_bonus_date !== today;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">@{user.username}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Streak: <span className="text-zinc-200">{user.daily_streak}</span> ·
              XP: <span className="text-zinc-200">{user.xp}</span>
              {user.is_admin && (
                <span className="ml-2 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-300">
                  admin
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Balance
            </div>
            <div className="font-mono text-2xl text-emerald-300">
              {formatCents(user.balance_cents)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={!canClaim || busy}
            onClick={claimDaily}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-40"
          >
            {canClaim ? "Claim daily bonus" : "Already claimed today"}
          </button>
          <span className="text-xs text-zinc-500">
            Base $50 + $10/day for up to 7-day streak.
          </span>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-300">
            {message}
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Inventory</h2>
        {inventory.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing yet — grab some power-ups in the shop.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {inventory.map((ui) => (
              <div
                key={ui.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{ui.item.name}</div>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {ui.item.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-zinc-700 px-2 py-0.5 text-xs">
                    {ui.item.is_consumable
                      ? `${ui.uses_remaining} use${ui.uses_remaining === 1 ? "" : "s"}`
                      : "owned"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Transactions</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2 text-right">Delta</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-t border-zinc-800">
                  <td className="px-3 py-2 text-zinc-400">
                    {formatDate(t.created_at)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{t.kind}</td>
                  <td className="px-3 py-2 text-zinc-400">{t.note ?? "—"}</td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${
                      t.delta_cents >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {t.delta_cents >= 0 ? "+" : ""}
                    {formatCents(t.delta_cents)}
                  </td>
                </tr>
              ))}
              {txs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-zinc-500"
                  >
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
