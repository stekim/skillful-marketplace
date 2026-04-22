"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    try {
      const { token, user } = await api<{ token: string; user: User }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ username }) },
      );
      setToken(token);
      setCachedUser(user);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="text-2xl font-semibold">Pick a username</h1>
      <p className="mt-2 text-sm text-zinc-400">
        New usernames get $1000 of virtual currency. Existing ones just log in.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          autoFocus
          required
          minLength={2}
          maxLength={40}
          pattern="[A-Za-z0-9_]+"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. highroller42"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
        <button
          disabled={loading}
          className="w-full rounded-md bg-emerald-500 px-3 py-2 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "…" : "Enter"}
        </button>
        {error && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-300">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
