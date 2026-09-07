"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AccountTabs, ErrorBlock, LoadingBlock, LockedBlock } from "@/components/AccountShell";
import ContentCard from "@/components/ContentCard";
import { useAnalysis } from "@/components/useAnalysis";
import clsx from "clsx";

export default function AccountAnalysisPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { username } = useParams<{ username: string }>();
  const niche = useSearchParams().get("niche") ?? "";
  const [tab, setTab] = useState<"posts" | "reels">("posts");
  const { loading, error, locked, boundAccount, data } = useAnalysis(username, niche);

  return (
    <div>
      <AccountTabs username={username} niche={niche} />

      {loading && <LoadingBlock />}
      {!loading && locked && <LockedBlock boundAccount={boundAccount} />}
      {!loading && error && <ErrorBlock message={error} />}

      {!loading && data && (
        <div>
          <div className="mb-6 flex gap-2 rounded-full border border-white/10 bg-white/5 p-1 w-fit">
            {(["posts", "reels"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "rounded-full px-5 py-2 text-sm font-semibold transition",
                  tab === t ? "bg-brand-gradient text-ink" : "text-white/60 hover:text-white"
                )}
              >
                {t === "posts" ? "📸 Топ-10 постов" : "🎬 Топ-10 Reels"}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(tab === "posts" ? data.posts : data.reels).map((item, i) => (
              <ContentCard key={item.id} item={item} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
