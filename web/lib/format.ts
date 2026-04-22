export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString()}.${rem.toString().padStart(2, "0")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export function statusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "active":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "pending_resolution":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "disputed":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "resolved":
      return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
    case "canceled":
      return "bg-zinc-600/15 text-zinc-400 border-zinc-600/30";
    default:
      return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  }
}
