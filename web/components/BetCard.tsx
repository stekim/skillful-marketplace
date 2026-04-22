import Link from "next/link";

import { formatCents, formatDate, statusColor } from "@/lib/format";
import type { Bet } from "@/lib/types";

export function BetCard({ bet }: { bet: Bet }) {
  return (
    <Link
      href={`/bets/${bet.id}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium text-zinc-100">{bet.title}</div>
          {bet.description && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {bet.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${statusColor(
            bet.status,
          )}`}
        >
          {bet.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-zinc-400">
          @{bet.creator_username}
          {bet.opponent_username && (
            <> vs @{bet.opponent_username}</>
          )}
        </div>
        <div className="font-mono text-emerald-300">
          {formatCents(bet.stake_cents)}
        </div>
      </div>
      <div className="mt-1 text-xs text-zinc-500">{formatDate(bet.created_at)}</div>
    </Link>
  );
}
