"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { track } from "@/lib/analytics";
import { api, clearAuth, getToken } from "@/lib/api";
import { formatCents } from "@/lib/format";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Feed", index: "01" },
  { href: "/bets/new", label: "New Bet", index: "02" },
  { href: "/shop", label: "Shop", index: "03" },
  { href: "/me", label: "Profile", index: "04" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
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
    track("logout_clicked");
    clearAuth();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="display text-xl text-foreground">Skillful</span>
          <span className="section-label text-emerald-500">/ 26</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "section-label transition-colors",
                  active
                    ? "text-foreground"
                    : "text-zinc-500 hover:text-foreground",
                )}
              >
                <span className="text-emerald-500">{item.index}.</span>{" "}
                {item.label}
              </Link>
            );
          })}
          {user?.is_admin && (
            <Link
              href="/admin"
              className={cn(
                "section-label transition-colors",
                pathname.startsWith("/admin")
                  ? "text-amber-400"
                  : "text-amber-500/70 hover:text-amber-400",
              )}
            >
              <span className="text-amber-500">00.</span> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {loaded && user ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="section-label text-zinc-500">Balance</div>
                <div className="font-mono text-sm text-emerald-400">
                  {formatCents(user.balance_cents)}
                </div>
              </div>
              <span className="hidden text-xs text-zinc-500 sm:inline">
                @{user.username}
              </span>
              <LiquidButton onClick={logout} size="sm">
                Logout
              </LiquidButton>
            </>
          ) : loaded ? (
            <LiquidButton onClick={() => router.push("/login")} size="sm">
              Log in
            </LiquidButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}
