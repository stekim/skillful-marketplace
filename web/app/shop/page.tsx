"use client";

import { useCallback, useEffect, useState } from "react";

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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shop</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Power-ups that tilt bets in your favor.
          </p>
        </div>
        {user && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
            {formatCents(user.balance_cents)}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((it) => {
          const owned = countOwned(it.slug);
          const affordable = (user?.balance_cents ?? 0) >= it.price_cents;
          return (
            <div
              key={it.slug}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{it.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{it.description}</p>
                </div>
                <span className="shrink-0 rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                  {it.is_consumable ? "consumable" : "permanent"}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  {owned > 0 ? `You own ${owned}` : "—"}
                </div>
                <button
                  disabled={!affordable || busy === it.slug}
                  onClick={() => buy(it.slug)}
                  className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Buy · {formatCents(it.price_cents)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
