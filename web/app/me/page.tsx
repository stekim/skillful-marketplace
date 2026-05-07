"use client";

import { useCallback, useEffect, useState } from "react";

import { SectionHeader, SubSection } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
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
      const r = await api<DailyBonusResult>("/me/claim-daily", {
        method: "POST",
      });
      setMessage(r.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user)
    return <p className="section-label text-zinc-500">Loading…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const canClaim = user.last_daily_bonus_date !== today;

  return (
    <div className="space-y-12">
      <SectionHeader
        index="04 / PROFILE"
        title={`@${user.username}`}
        tagline="Your bankroll, your streak, your audit trail. Every dollar that ever moved through this account is in the transaction log."
      >
        {user.is_admin && (
          <div className="mt-4 inline-block border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300">
            admin
          </div>
        )}
      </SectionHeader>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
        <Stat label="Balance" value={formatCents(user.balance_cents)} accent />
        <Stat label="Daily streak" value={`${user.daily_streak} days`} />
        <Stat label="XP" value={`${user.xp}`} />
      </div>

      <div className="border border-border bg-secondary/20 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="section-label text-zinc-500">Daily bonus</div>
            <div className="display-tight mt-2 text-2xl text-foreground">
              {canClaim ? "Claim today's bonus" : "Already claimed"}
            </div>
            <p className="mt-2 max-w-md text-sm text-zinc-400">
              Base $50, plus $10 per consecutive day, capped at a 7-day streak.
              Miss a day and the streak resets — unless you have a Streak
              Freeze.
            </p>
          </div>
          <LiquidButton
            disabled={!canClaim || busy}
            onClick={claimDaily}
            size="lg"
          >
            {canClaim ? "Claim →" : "Locked"}
          </LiquidButton>
        </div>

        {error && (
          <div className="mt-4 border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {message}
          </div>
        )}
      </div>

      <SubSection
        index="04/A · INVENTORY"
        title="Power-ups in hand."
        description="Consumables show charges remaining. Permanents are forever."
      >
        {inventory.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-500">
            Nothing yet — grab some power-ups in the shop.
          </p>
        ) : (
          <div className="mt-8 grid gap-px bg-border sm:grid-cols-2">
            {inventory.map((ui) => (
              <div
                key={ui.id}
                className="flex flex-col gap-3 bg-background p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="section-label text-zinc-500">
                    {ui.item.slug}
                  </span>
                  <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-300">
                    {ui.item.is_consumable
                      ? `${ui.uses_remaining} use${ui.uses_remaining === 1 ? "" : "s"}`
                      : "owned"}
                  </span>
                </div>
                <div className="display-tight text-xl text-foreground">
                  {ui.item.name}
                </div>
                <p className="text-xs text-zinc-400">{ui.item.description}</p>
              </div>
            ))}
          </div>
        )}
      </SubSection>

      <SubSection
        index="04/B · TRANSACTIONS"
        title="The audit log."
        description="Every balance change, append-only, in chronological order."
      >
        <div className="mt-8 overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <Th>When</Th>
                <Th>Kind</Th>
                <Th>Note</Th>
                <Th align="right">Delta</Th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 text-zinc-400">
                    {formatDate(t.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                    {t.kind}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{t.note ?? "—"}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      t.delta_cents >= 0 ? "text-emerald-400" : "text-rose-400"
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
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SubSection>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background p-6">
      <div className="section-label text-zinc-500">{label}</div>
      <div
        className={`display mt-3 text-3xl ${
          accent ? "text-emerald-400" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
