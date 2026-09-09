"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, GhostButton, PrimaryButton, SectionTitle } from "@/components/ui";
import { DataSourceBanner } from "@/components/AccountShell";
import { formatCompact, formatPercent } from "@/lib/format";
import type { AccountSummary } from "@/lib/mock/types";

const SUGGESTIONS = [
  "Маникюр в Алматы",
  "Кофейни в Астане",
  "Фитнес-тренеры в Ташкенте",
  "Стоматология в Бишкеке",
  "Ремонт квартир в Караганде",
];

export default function DashboardPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "mock" | undefined>(undefined);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);

  const [directHandle, setDirectHandle] = useState("");
  const [directNiche, setDirectNiche] = useState("");
  const [directError, setDirectError] = useState<string | null>(null);

  function applySuggestion(s: string) {
    const parts = s.split(" в ");
    setNiche(parts[0]);
    setLocation(parts[1] ?? "");
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!niche.trim()) {
      setError("Укажите нишу, например «Маникюр»");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Не удалось выполнить поиск");
        setAccounts(null);
        setDataSource(undefined);
        return;
      }
      setAccounts(data.accounts);
      setDataSource(data.dataSource);
      setSearchWarning(data.warning ?? null);
    } catch {
      setError("Ошибка сети, попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  function openAccount(username: string, nicheForAccount: string) {
    router.push(`/dashboard/account/${username}?niche=${encodeURIComponent(nicheForAccount)}`);
  }

  function cleanHandle(raw: string): string {
    return raw
      .trim()
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/\/.*$/, "")
      .replace(/[?#].*$/, "");
  }

  function analyzeDirect(e: React.FormEvent) {
    e.preventDefault();
    const handle = cleanHandle(directHandle);
    if (!handle) {
      setDirectError("Введите имя аккаунта или ссылку на профиль");
      return;
    }
    const effectiveNiche = directNiche.trim() || niche.trim();
    if (!effectiveNiche) {
      setDirectError("Укажите нишу аккаунта — это нужно для точного анализа и подбора тем");
      return;
    }
    setDirectError(null);
    openAccount(handle, effectiveNiche);
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Шаг 1"
        title="Найдите самые многочисленные аккаунты по нише"
        subtitle="Укажите нишу и город — получите рейтинг аккаунтов, отсортированный по числу подписчиков."
      />

      <Card className="mt-8">
        <form onSubmit={search} className="grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]">
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ниша, например «Маникюр»"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Город (необязательно)"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400"
          />
          <PrimaryButton type="submit" disabled={loading} className="whitespace-nowrap px-7">
            {loading ? "Ищем…" : "Найти аккаунты"}
          </PrimaryButton>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => applySuggestion(s)}
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:border-violet-400 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-flame-400">{error}</p>}
      </Card>

      <Card className="mt-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h4 className="font-display text-sm font-bold">Уже знаете аккаунт для анализа?</h4>
        </div>
        <p className="mt-1 text-xs text-white/50">
          Свой аккаунт или аккаунт клиента — введите ник или ссылку на профиль и перейдите к анализу напрямую, без поиска по нише.
        </p>
        <form onSubmit={analyzeDirect} className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.8fr_auto]">
          <input
            value={directHandle}
            onChange={(e) => setDirectHandle(e.target.value)}
            placeholder="@username или ссылка на профиль"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400"
          />
          <input
            value={directNiche}
            onChange={(e) => setDirectNiche(e.target.value)}
            placeholder={niche ? `Ниша (по умолчанию «${niche}»)` : "Ниша аккаунта"}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400"
          />
          <GhostButton type="submit" className="whitespace-nowrap px-7">
            Анализировать напрямую →
          </GhostButton>
        </form>
        {directError && <p className="mt-3 text-sm text-flame-400">{directError}</p>}
      </Card>

      {accounts && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Топ аккаунтов по нише «{niche}»{location && ` · ${location}`}</h3>
            <Badge tone="neutral">{accounts.length} аккаунтов</Badge>
          </div>
          <DataSourceBanner dataSource={dataSource} warning={searchWarning} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <Card key={a.username} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})` }}
                  >
                    #{a.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-display font-bold">{a.displayName}</p>
                      {a.verified && <span title="Верифицирован">✅</span>}
                    </div>
                    <p className="truncate text-xs text-white/45">@{a.username}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/60">{a.bio}</p>
                {a.locationVerified === true && (
                  <Badge tone="mint" className="mt-2 w-fit">📍 Город подтверждён в профиле</Badge>
                )}
                {a.locationVerified === false && (
                  <Badge tone="neutral" className="mt-2 w-fit">📍 Город не подтверждён профилем</Badge>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-display text-sm font-bold">{formatCompact(a.followers)}</div>
                    <div className="text-[10px] text-white/40">подписчиков</div>
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold">{a.posts}</div>
                    <div className="text-[10px] text-white/40">публикаций</div>
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-mint-400">{formatPercent(a.avgEngagementRate)}</div>
                    <div className="text-[10px] text-white/40">вовлечённость</div>
                  </div>
                </div>
                <GhostButton onClick={() => openAccount(a.username, niche)} className="mt-5 w-full py-2.5 text-sm">
                  Анализировать →
                </GhostButton>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
