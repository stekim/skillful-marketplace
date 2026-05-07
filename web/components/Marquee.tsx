const PHRASES = [
  "Skillful / 26",
  "Post Bets",
  "Take Bets",
  "Stack Streaks",
  "Spend Power-ups",
  "Win the Pot",
  "100% Skill",
  "0% Luck",
];

export function Marquee() {
  const items = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES];
  return (
    <div className="border-b border-border bg-background">
      <div className="overflow-hidden py-2">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {items.map((p, i) => (
            <span
              key={`${p}-${i}`}
              className="section-label text-zinc-500"
            >
              <span className="mr-3 text-emerald-500">●</span>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
