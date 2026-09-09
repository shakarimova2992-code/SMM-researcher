"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AccountTabs, DataSourceBanner, ErrorBlock, LoadingBlock, LockedBlock } from "@/components/AccountShell";
import { useAnalysis } from "@/components/useAnalysis";
import { Badge, Card } from "@/components/ui";

export default function IdeasPage() {
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
      {loading && <LoadingBlock label="Адаптируем залетевшие форматы под нишу…" />}
      {!loading && locked && <LockedBlock boundAccount={boundAccount} />}
      {!loading && error && <ErrorBlock message={error} />}

      {!loading && data && (
        <div>
          <DataSourceBanner dataSource={data.dataSource} warning={data.warning} />
          <p className="mb-6 max-w-xl text-sm text-white/60">
            Топ-10 тем адаптированы под нишу «{niche}» на основе форматов, которые уже хорошо работают у лидеров этой ниши.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.ideas.map((idea) => (
              <Card key={idea.id} className="flex gap-4">
                <span className="font-display text-2xl font-extrabold text-white/15">{String(idea.rank).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">{idea.format}</Badge>
                    <span className="text-xs">{idea.trendLabel}</span>
                  </div>
                  <h3 className="mt-2 font-display font-bold leading-snug">{idea.title}</h3>
                  <p className="mt-2 text-xs text-white/50">{idea.why}</p>
                  <p className="mt-2 text-xs text-white/40">Хук: «{idea.hook}»</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
