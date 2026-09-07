import Link from "next/link";
import clsx from "clsx";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("flex items-center gap-2 font-display font-extrabold text-lg", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
        <span className="text-base">📡</span>
      </span>
      <span>
        Niche<span className="text-gradient">Scope</span>
      </span>
    </Link>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "violet",
  className,
}: {
  children: React.ReactNode;
  tone?: "violet" | "mint" | "gold" | "flame" | "neutral";
  className?: string;
}) {
  const tones: Record<string, string> = {
    violet: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    mint: "bg-mint-500/15 text-mint-400 border-mint-400/30",
    gold: "bg-gold-500/15 text-gold-400 border-gold-400/30",
    flame: "bg-flame-500/15 text-flame-400 border-flame-400/30",
    neutral: "bg-white/5 text-white/70 border-white/10",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-display font-bold text-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("glass rounded-xl2 p-6 shadow-card", className)}>{children}</div>;
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={clsx("max-w-2xl", className)}>
      {eyebrow && <Badge tone="violet">{eyebrow}</Badge>}
      <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-white/65">{subtitle}</p>}
    </div>
  );
}
