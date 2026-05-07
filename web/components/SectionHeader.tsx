import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  index: string;
  title: string;
  tagline?: string;
  quote?: { text: string; author: string; role: string };
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  index,
  title,
  tagline,
  quote,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <header className={cn("mb-10", className)}>
      <div className="section-label text-emerald-500">{index}</div>
      <h1 className="display mt-3 text-5xl text-foreground sm:text-7xl">
        {title}
      </h1>
      {tagline && (
        <p className="mt-4 max-w-2xl text-base text-zinc-400 sm:text-lg">
          {tagline}
        </p>
      )}
      {quote && (
        <figure className="mt-8 max-w-2xl border-l-2 border-emerald-500 pl-5">
          <blockquote className="text-balance text-lg italic text-zinc-300">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="section-label mt-3 text-zinc-500">
            <span className="text-zinc-300">{quote.author}</span>
            <span className="mx-2 text-zinc-600">·</span>
            {quote.role}
          </figcaption>
        </figure>
      )}
      {children}
    </header>
  );
}

export function SubSection({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-10">
      <div className="section-label text-zinc-500">{index}</div>
      <h2 className="display-tight mt-2 text-3xl text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-xl text-sm text-zinc-400">{description}</p>
      )}
      {children}
    </section>
  );
}
