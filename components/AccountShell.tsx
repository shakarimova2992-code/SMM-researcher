"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Badge, Card, PrimaryButton } from "@/components/ui";

const TABS = [
  { key: "", label: "Топ-10 постов/Reels", icon: "📊" },
  { key: "report", label: "Подробный отчёт", icon: "🧠" },
  { key: "ideas", label: "10 тем для контента", icon: "💡" },
  { key: "presentation", label: "Презентация", icon: "🖥️" },
];

export function AccountTabs({ username, niche }: { username: string; niche: string }) {
  const pathname = usePathname();
  const base = `/dashboard/account/${username}`;
  const q = `?niche=${encodeURIComponent(niche)}`;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Link href={`/dashboard`} className="text-xs text-white/40 hover:text-white/70">
          ← Другой аккаунт
        </Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold">@{username}</h1>
        <Badge tone="violet" className="mt-2">{niche}</Badge>
      </div>
      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const href = `${base}${t.key ? `/${t.key}` : ""}${q}`;
          const active = pathname === `${base}${t.key ? `/${t.key}` : ""}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={clsx(
                "rounded-full border px-4 py-2 text-xs font-semibold transition",
                active
                  ? "border-transparent bg-brand-gradient text-ink"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              )}
            >
              {t.icon} {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function LoadingBlock({ label = "Анализируем аккаунт…" }: { label?: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400" />
      <p className="text-sm text-white/50">{label}</p>
    </Card>
  );
}

export function LockedBlock({ boundAccount }: { boundAccount: string | null }) {
  return (
    <Card className="flex flex-col items-center gap-4 bg-brand-gradient-soft py-14 text-center">
      <span className="text-3xl">🔒</span>
      <h2 className="font-display text-xl font-bold">Эта ссылка уже привязана к другому аккаунту</h2>
      <p className="max-w-md text-sm text-white/60">
        По одной ссылке (email-входу) доступен анализ только одного Instagram-аккаунта.
        {boundAccount && (
          <>
            {" "}
            Ваш привязанный аккаунт: <span className="font-semibold text-white">@{boundAccount}</span>.
          </>
        )}
      </p>
      {boundAccount ? (
        <Link href={`/dashboard/account/${boundAccount}`}>
          <PrimaryButton className="px-6 py-3 text-sm">Перейти к @{boundAccount} →</PrimaryButton>
        </Link>
      ) : (
        <Link href="/dashboard">
          <PrimaryButton className="px-6 py-3 text-sm">К поиску →</PrimaryButton>
        </Link>
      )}
    </Card>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <Card className="py-10 text-center text-sm text-flame-400">{message}</Card>
  );
}

export function DataSourceBanner({ dataSource, warning }: { dataSource?: "live" | "mock"; warning?: string | null }) {
  if (!dataSource) return null;

  if (dataSource === "live") {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-mint-400/30 bg-mint-400/10 px-4 py-3 text-sm text-white/80">
        <span>✅</span>
        <span className="font-semibold text-mint-400">Реальные данные Instagram</span>
        <span className="text-white/60">— профиль и публикации получены напрямую из аккаунта.</span>
        {warning && <span className="text-gold-400">{warning}</span>}
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-white/80">
      <span>🧪</span>
      <span className="font-semibold text-gold-400">Демонстрационные данные</span>
      <span className="text-white/60">
        {warning ?? "Не удалось получить реальные данные этого аккаунта — показан пример на моковых данных."}
      </span>
    </div>
  );
}
