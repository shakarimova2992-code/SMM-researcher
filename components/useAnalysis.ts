"use client";

import { useEffect, useState } from "react";
import type { ContentItem, Report, ChecklistItem, IdeaItem } from "@/lib/mock/types";

export type AnalysisData = {
  username: string;
  niche: string;
  posts: ContentItem[];
  reels: ContentItem[];
  report: Report;
  checklist: ChecklistItem[];
  ideas: IdeaItem[];
};

type State = {
  loading: boolean;
  error: string | null;
  locked: boolean;
  boundAccount: string | null;
  data: AnalysisData | null;
};

export function useAnalysis(username: string, niche: string) {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    locked: false,
    boundAccount: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, niche }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 403 && data.error === "account_locked") {
          setState({ loading: false, error: null, locked: true, boundAccount: data.boundAccount, data: null });
          return;
        }
        if (!res.ok || !data.ok) {
          setState({ loading: false, error: data.message ?? data.error ?? "Ошибка анализа", locked: false, boundAccount: null, data: null });
          return;
        }
        setState({ loading: false, error: null, locked: false, boundAccount: null, data });
      } catch {
        if (!cancelled) {
          setState({ loading: false, error: "Ошибка сети, попробуйте ещё раз", locked: false, boundAccount: null, data: null });
        }
      }
    }
    if (username && niche) run();
    return () => {
      cancelled = true;
    };
  }, [username, niche]);

  return state;
}
