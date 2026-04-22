"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, clearAuth, getToken } from "@/lib/api";
import { formatCents } from "@/lib/format";
import type { User } from "@/lib/types";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoaded(true);
      return;
    }
    api<User>("/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  function logout() {
    clearAuth();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Skillful
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-zinc-300 hover:text-white">
            Feed
          </Link>
          <Link href="/bets/new" className="text-zinc-300 hover:text-white">
            New Bet
          </Link>
          <Link href="/shop" className="text-zinc-300 hover:text-white">
            Shop
          </Link>
          <Link href="/me" className="text-zinc-300 hover:text-white">
            Profile
          </Link>
          {user?.is_admin && (
            <Link href="/admin" className="text-amber-300 hover:text-amber-200">
              Admin
            </Link>
          )}
          {loaded && user ? (
            <>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                {formatCents(user.balance_cents)}
              </span>
              <span className="text-zinc-400">@{user.username}</span>
              <button
                onClick={logout}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Logout
              </button>
            </>
          ) : loaded ? (
            <Link
              href="/login"
              className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-black hover:bg-emerald-400"
            >
              Log in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
