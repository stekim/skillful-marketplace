"use client";

import { useCallback, useEffect, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { api } from "@/lib/api";
import { formatCents } from "@/lib/format";
import type { Item, User, UserItem } from "@/lib/types";

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<UserItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [is, inv, u] = await Promise.all([
      api<Item[]>("/items"),
      api<UserItem[]>("/me/inventory"),
      api<User>("/me"),
    ]);
    setItems(is);
    setInventory(inv);
    setUser(u);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function buy(slug: string) {
    setError(null);
    setMessage(null);
    setBusy(slug);
    try {
      const ui = await api<UserItem>(`/items/${slug}/buy`, { method: "POST" });
      setMessage(`Purchased ${ui.item.name}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBusy(null);
    }
  }

  function countOwned(slug: string): number {
    return inventory
      .filter((i) => i.item.slug === slug)
      .reduce((n, i) => n + i.uses_remaining, 0);
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        index="03 / SHOP"
        title="Tilt the table."
        tagline="Power-ups that bend the marketplace in your favor. Consumables charge per use. Permanents stick."
        quote={{
          text: "Every economy needs a sink. The shop is ours — and it's where the meta lives.",
          author: "Skillful",
          role: "Designer's note",
        }}
      >
        {user && (
          <div className="mt-8 inline-flex items-baseline gap-3 border border-border bg-secondary/30 px-5 py-3">
            <span className="section-label text-zinc-500">Your bankroll</span>
            <span className="font-mono text-lg text-emerald-400">
              {formatCents(user.balance_cents)}
            </span>
          </div>
        )}
      </SectionHeader>

      {error && (
        <div className="border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      {message && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const owned = countOwned(it.slug);
          const affordable = (user?.balance_cents ?? 0) >= it.price_cents;
          return (
            <div
              key={it.slug}
              className="flex flex-col bg-background p-6 transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between">
                <span className="section-label text-zinc-500">
                  03/{String.fromCharCode(65 + (i % 26))}
                </span>
                <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-400">
                  {it.is_consumable ? "consumable" : "permanent"}
                </span>
              </div>
              <h3 className="display-tight mt-6 text-2xl text-foreground">
                {it.name}
              </h3>
              <p className="mt-3 flex-1 text-sm text-zinc-400">
                {it.description}
              </p>
              <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
                <div>
                  <div className="section-label text-zinc-500">
                    {owned > 0 ? `Owned · ${owned}` : "Not owned"}
                  </div>
                  <div className="mt-1 font-mono text-emerald-400">
                    {formatCents(it.price_cents)}
                  </div>
                </div>
                <LiquidButton
                  disabled={!affordable || busy === it.slug}
                  onClick={() => buy(it.slug)}
                  size="default"
                >
                  Buy →
                </LiquidButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
