import { cn } from "@/lib/utils";

interface FeatureCardProps {
  index?: string;
  title: string;
  description: string;
  cta?: string;
  href?: string;
  className?: string;
}

export function FeatureCard({
  index,
  title,
  description,
  cta,
  href,
  className,
}: FeatureCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        {index && (
          <span className="section-label text-zinc-500">{index}</span>
        )}
        <span className="section-label text-zinc-600">
          {cta ?? "Read more"} →
        </span>
      </div>
      <h3 className="display-tight mt-8 text-2xl text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
    </>
  );

  const classes = cn(
    "group relative flex h-full flex-col justify-between rounded-none border border-border bg-secondary/40 p-6 transition-colors hover:border-emerald-500/60 hover:bg-secondary/80",
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }
  return <div className={classes}>{inner}</div>;
}
