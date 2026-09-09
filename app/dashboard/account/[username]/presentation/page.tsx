"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AccountTabs, DataSourceBanner, ErrorBlock, LoadingBlock, LockedBlock } from "@/components/AccountShell";
import { useAnalysis } from "@/components/useAnalysis";
import { Badge, Logo, PrimaryButton } from "@/components/ui";
import { formatCompact, formatPercent } from "@/lib/format";
import type { ChecklistItem } from "@/lib/mock/types";
import clsx from "clsx";

export default function PresentationPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Inner />
    </Suspense>
  );
}

const SEVERITY_LABEL: Record<ChecklistItem["severity"], { label: string; tone: "flame" | "gold" | "mint" }> = {
  critical: { label: "Критично", tone: "flame" },
  warning: { label: "Важно", tone: "gold" },
  opportunity: { label: "Возможность", tone: "mint" },
};

function Inner() {
  const { username } = useParams<{ username: string }>();
  const niche = useSearchParams().get("niche") ?? "";
  const { loading, error, locked, boundAccount, data } = useAnalysis(username, niche);

  return (
    <div>
      <div className="no-print">
        <AccountTabs username={username} niche={niche} />
      </div>
      {loading && <LoadingBlock label="Собираем презентацию…" />}
      {!loading && locked && <LockedBlock boundAccount={boundAccount} />}
      {!loading && error && <ErrorBlock message={error} />}

      {!loading && data && (
        <div>
          <div className="no-print">
            <DataSourceBanner dataSource={data.dataSource} warning={data.warning} />
          </div>
          <div className="no-print mb-6 flex justify-end">
            <PrimaryButton onClick={() => window.print()} className="px-6 py-3 text-sm">
              🖨️ Скачать / распечатать презентацию
            </PrimaryButton>
          </div>

          <div className="space-y-6">
            {/* Slide 1 — Title */}
            <Slide className="flex flex-col items-center justify-center text-center bg-brand-gradient-soft">
              <Logo className="mb-6" />
              <Badge tone="gold">Экспресс-диагностика</Badge>
              <h1 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl">
                @{username}
              </h1>
              <p className="mt-2 text-white/60">Ниша: {niche}</p>
              <p className="mt-8 text-xs text-white/35">
                Подготовлено в NicheScope · {new Date().toLocaleDateString("ru-RU")}
              </p>
            </Slide>

            {/* Slide 2 — Overview */}
            <Slide>
              <SlideHeader eyebrow="Слайд 2" title="Как аккаунт выглядит сейчас" />
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniStat label="Ср. лайки/пост" value={formatCompact(data.report.avgLikes)} />
                <MiniStat label="Ср. просмотры Reels" value={formatCompact(data.report.avgViews)} />
                <MiniStat label="Вовлечённость" value={formatPercent(data.report.engagementRate)} />
                <MiniStat label="Бенчмарк ниши" value={`~${data.report.engagementBenchmark}%`} />
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/20 p-5">
                  <p className="text-sm font-semibold text-white/80">📸 Посты</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/55">
                    {data.report.postInsights.slice(0, 2).map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-black/20 p-5">
                  <p className="text-sm font-semibold text-white/80">🎬 Reels</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/55">
                    {data.report.reelInsights.slice(0, 2).map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                </div>
              </div>
            </Slide>

            {/* Slide 3 — Problems */}
            <Slide>
              <SlideHeader eyebrow="Слайд 3" title="Проблемные моменты и что с ними делать" />
              <div className="mt-6 space-y-3">
                {data.checklist.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={SEVERITY_LABEL[c.severity].tone}>{SEVERITY_LABEL[c.severity].label}</Badge>
                      <h4 className="font-display font-bold">{c.title}</h4>
                    </div>
                    <p className="mt-2 text-sm text-white/55">
                      <span className="text-white/35">Проблема: </span>
                      {c.problem}
                    </p>
                    <p className="mt-1 text-sm text-mint-400">
                      <span className="text-white/35">Решение: </span>
                      {c.fix}
                    </p>
                  </div>
                ))}
              </div>
            </Slide>

            {/* Slide 4 — Ideas */}
            <Slide>
              <SlideHeader eyebrow="Слайд 4" title="Топ-10 тем под нишу" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {data.ideas.map((idea) => (
                  <div key={idea.id} className="flex gap-3 rounded-2xl bg-black/20 p-4">
                    <span className="font-display text-xl font-extrabold text-white/20">
                      {String(idea.rank).padStart(2, "0")}
                    </span>
                    <div>
                      <Badge tone="violet" className="mb-1.5">{idea.format}</Badge>
                      <p className="text-sm font-semibold leading-snug">{idea.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Slide>

            {/* Slide 5 — Next steps */}
            <Slide className="flex flex-col items-center justify-center text-center bg-brand-gradient-soft">
              <span className="text-3xl">🚀</span>
              <h2 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">Следующие шаги</h2>
              <div className="mt-6 grid max-w-lg gap-3 text-left">
                <NextStep n={1} text={`Закрыть ${data.checklist.filter((c) => c.severity === "critical").length} критичные проблемы в первую очередь`} />
                <NextStep n={2} text="Запустить 2-3 темы из топ-10 в ближайшие 2 недели" />
                <NextStep n={3} text={`Публиковать по расписанию в слоты: ${data.report.bestSlots.join(", ")}`} />
                <NextStep n={4} text="Через 30 дней повторить диагностику и сравнить динамику" />
              </div>
            </Slide>
          </div>
        </div>
      )}
    </div>
  );
}

function Slide({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={clsx(
        "print-slide glass rounded-xl2 p-8 shadow-card sm:p-10",
        "min-h-[70vh]",
        className
      )}
    >
      {children}
    </section>
  );
}

function SlideHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <Badge tone="neutral">{eyebrow}</Badge>
      <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4 text-center">
      <div className="font-display text-xl font-extrabold">{value}</div>
      <div className="mt-1 text-[11px] text-white/40">{label}</div>
    </div>
  );
}

function NextStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-ink">
        {n}
      </span>
      <span className="text-sm text-white/75">{text}</span>
    </div>
  );
}
