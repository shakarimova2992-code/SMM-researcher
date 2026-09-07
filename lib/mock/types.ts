export type AccountSummary = {
  username: string;
  displayName: string;
  city: string;
  followers: number;
  posts: number;
  avgEngagementRate: number;
  verified: boolean;
  category: string;
  bio: string;
  gradient: [string, string];
  rank: number;
};

export type ContentItem = {
  id: string;
  type: "post" | "reel";
  format: string;
  caption: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number | null;
  engagementRate: number;
  hook: string;
  gradient: [string, string];
  emoji: string;
};

export type DayHour = { day: string; hour: number; value: number };

export type Report = {
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  engagementRate: number;
  engagementBenchmark: number;
  postFrequencyPerWeek: number;
  reelFrequencyPerWeek: number;
  formatMix: { label: string; value: number }[];
  growth: { month: string; followers: number }[];
  heatmap: DayHour[];
  bestSlots: string[];
  topHashtags: { tag: string; avgLikes: number }[];
  postInsights: string[];
  reelInsights: string[];
};

export type ChecklistItem = {
  id: string;
  severity: "critical" | "warning" | "opportunity";
  title: string;
  problem: string;
  fix: string;
};

export type IdeaItem = {
  id: string;
  rank: number;
  title: string;
  format: "Reels" | "Карусель" | "Пост";
  trendLabel: string;
  why: string;
  hook: string;
};
