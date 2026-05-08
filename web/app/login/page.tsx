"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { track } from "@/lib/analytics";
import { api, setCachedUser, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    track("login_submitted");
    try {
      const { token, user } = await api<{ token: string; user: User }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ username }) },
      );
      setToken(token);
      setCachedUser(user);
      track("login_succeeded", { user_id: user.id, is_new: user.balance_cents === 100000 });
      router.push("/");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      track("login_failed", { reason: message });
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeader
        index="00 / SIGN IN"
        title="Pick a name."
        tagline="New usernames mint a fresh account with $1,000 of virtual currency. Existing names just log back in. No password — this is a stub auth, JWT under the hood."
      />

      <form
        onSubmit={submit}
        className="mt-10 space-y-4 border border-border bg-secondary/30 p-8"
      >
        <label className="section-label block text-zinc-400">Username</label>
        <input
          autoFocus
          required
          minLength={2}
          maxLength={40}
          pattern="[A-Za-z0-9_]+"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="highroller42"
          className="display-tight w-full border-0 border-b border-border bg-transparent pb-3 text-2xl text-foreground placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
        />
        <p className="text-xs text-zinc-500">
          Letters, numbers, and underscore only. 2–40 characters.
        </p>
        <div className="pt-4">
          <LiquidButton
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? "…" : "Enter the marketplace →"}
          </LiquidButton>
        </div>
        {error && (
          <div className="border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
