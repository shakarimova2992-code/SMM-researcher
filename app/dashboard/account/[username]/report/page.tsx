"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AccountTabs, ErrorBlock, LoadingBlock, LockedBlock } from "@/components/AccountShell";
import { useAnalysis } from "@/components/useAnalysis";
import { Badge, Card } from "@/components/ui";
import { formatCompact } from "@/lib/format";
import { FormatMixChart, GrowthChart, Heatmap } from "@/components/charts";

export default function ReportPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { username } = useParams<{ username: string }>();
  const niche = useSearchParams().get("niche") ?? "";
  const { loading, error, locked, boundAccount, data } = useAnalysis(username, niche);

  return (
    <div>
      <AccountTabs username={username} niche={niche} />
      {loading && <LoadingBlock label="Считаем метрики и паттерны…" />}
      {!loading && locked && <LockedBlock boundAccount={boundAccount} />}
      {!loading && error && <ErrorBlock message={error} />}

      {!loading && data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ср. лайки на пост" value={formatCompact(data.report.avgLikes)} />
            <Stat label="Ср. просмотры Reels" value={formatCompact(data.report.avgViews)} />
            <Stat
              label="Вовлечённость (ER)"
              value={`${data.report.engagementRate}%`}
              hint={`бенчмарк ниши ${data.report.engagementBenchmark}%`}
              good={data.report.engagementRate >= data.report.engagementBenchmark}
            />
            <Stat label="Публикаций в неделю" value={`${data.report.postFrequencyPerWeek} постов · ${data.report.reelFrequencyPerWeek} Reels`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="font-display font-bold">Рост аудитории (6 мес)</h3>
              <div className="mt-4">
                <GrowthChart data={data.report.growth} />
              </div>
            </Card>
            <Card>
              <h3 className="font-display font-bold">Микс форматов контента</h3>
              <div className="mt-6">
                <FormatMixChart data={data.report.formatMix} />
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold">Лучшее время для публикаций</h3>
              <div className="flex flex-wrap gap-2">
                {data.report.bestSlots.map((s) => (
                  <Badge key={s} tone="mint">{s}</Badge>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <Heatmap data={data.report.heatmap} />
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="font-display font-bold">📸 Что работает в постах</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {data.report.postInsights.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-violet-300">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="font-display font-bold">🎬 Что работает в Reels</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {data.report.reelInsights.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-flame-400">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <h3 className="font-display font-bold">Топ хэштегов ниши</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.report.topHashtags.map((h) => (
                <div key={h.tag} className="rounded-xl bg-black/20 p-3">
                  <div className="font-semibold text-violet-200">#{h.tag}</div>
                  <div className="text-xs text-white/40">~{formatCompact(h.avgLikes)} лайков в среднем</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, good }: { label: string; value: string; hint?: string; good?: boolean }) {
  return (
    <Card>
      <div className="text-xs text-white/45">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
      {hint && (
        <div className={`mt-1 text-xs ${good === undefined ? "text-white/40" : good ? "text-mint-400" : "text-flame-400"}`}>
          {hint} {good !== undefined && (good ? "↑" : "↓")}
        </div>
      )}
    </Card>
  );
}
