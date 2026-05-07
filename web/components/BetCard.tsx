import Link from "next/link";

import { formatCents, formatDate, statusColor } from "@/lib/format";
import type { Bet } from "@/lib/types";

export function BetCard({ bet, index }: { bet: Bet; index?: string }) {
  return (
    <Link
      href={`/bets/${bet.id}`}
      className="group relative flex flex-col gap-6 bg-background p-6 transition-colors hover:bg-secondary/60"
    >
      <div className="flex items-start justify-between gap-4">
        {index && (
          <span className="section-label text-zinc-500">{index}</span>
        )}
        <span
          className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusColor(
            bet.status,
          )}`}
        >
          {bet.status.replace("_", " ")}
        </span>
      </div>

      <div>
        <div className="display-tight text-2xl text-foreground transition-colors group-hover:text-emerald-300">
          {bet.title}
        </div>
        {bet.description && (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
            {bet.description}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
        <div className="text-zinc-400">
          @{bet.creator_username}
          {bet.opponent_username && (
            <>
              <span className="mx-2 text-zinc-600">vs</span>
              @{bet.opponent_username}
            </>
          )}
        </div>
        <div className="font-mono text-emerald-400">
          {formatCents(bet.stake_cents)}
        </div>
      </div>
      <div className="section-label text-zinc-600">
        {formatDate(bet.created_at)}
      </div>
    </Link>
  );
}
