import { runApifyActor, ApifyError } from "./apify";
import { detectNiche } from "@/lib/mock/niches";
import { generateChecklist, generateIdeas } from "@/lib/mock/engine";
import { mulberry32, hashString, pick, pickMany, randFloat } from "@/lib/mock/rng";
import type { ContentItem, Report, DayHour } from "@/lib/mock/types";

// Актор для профиля — лёгкий и дешёвый (1 результат = 1 профиль).
const PROFILE_ACTOR = "apify~instagram-profile-scraper";
// Актор для постов/Reels — тот же, что описан в apify.com/apify/instagram-scraper.
const CONTENT_ACTOR = "apify~instagram-scraper";

type RawProfile = Record<string, any>;
type RawItem = Record<string, any>;

function firstDefined<T>(...values: (T | undefined | null)[]): T | undefined {
  for (const v of values) if (v !== undefined && v !== null) return v;
  return undefined;
}

export type LiveProfile = {
  followersCount: number | null;
  followsCount: number | null;
  postsCount: number | null;
  biography: string;
  verified: boolean;
  fullName: string;
};

export async function fetchLiveProfile(username: string): Promise<LiveProfile | null> {
  try {
    const items = await runApifyActor<RawProfile>(PROFILE_ACTOR, {
      usernames: [username],
    });
    const raw = items[0];
    if (!raw) return null;
    return {
      followersCount: firstDefined<number>(raw.followersCount, raw.followers, raw.edge_followed_by?.count) ?? null,
      followsCount: firstDefined<number>(raw.followsCount, raw.following) ?? null,
      postsCount: firstDefined<number>(raw.postsCount, raw.mediaCount) ?? null,
      biography: firstDefined<string>(raw.biography, raw.bio) ?? "",
      verified: Boolean(firstDefined<boolean>(raw.verified, raw.isVerified)),
      fullName: firstDefined<string>(raw.fullName, raw.full_name) ?? username,
    };
  } catch (err) {
    console.warn(`[live] Не удалось получить профиль @${username}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function guessFormat(raw: RawItem, type: "post" | "reel"): string {
  if (type === "reel") return "Reels";
  const t = String(firstDefined<string>(raw.type, raw.productType, "") ?? "").toLowerCase();
  if (t.includes("sidecar") || t.includes("carousel")) return "Карусель";
  if (t.includes("video")) return "Видео";
  return "Одно фото";
}

const HOOK_EMOJIS = ["🔥", "✨", "💡", "📈", "🎯", "💬", "🎬", "🏆"];
const GRADIENTS: [string, string][] = [
  ["#8226ff", "#ff3d7f"], ["#ff5f6d", "#ffb703"], ["#3df2c0", "#8226ff"], ["#ff8a5c", "#8226ff"],
  ["#ffd166", "#ff3d7f"], ["#6d0fe0", "#3df2c0"], ["#ff3d7f", "#ffb703"], ["#9750ff", "#ff8a5c"],
];

function mapRawItem(raw: RawItem, type: "post" | "reel", index: number, niche: ReturnType<typeof detectNiche>, followersCount: number | null): ContentItem {
  const id = String(firstDefined<string | number>(raw.id, raw.shortCode, `${type}-${index}`));
  const likes = firstDefined<number>(raw.likesCount, raw.likes) ?? 0;
  const comments = firstDefined<number>(raw.commentsCount, raw.comments) ?? 0;
  const views =
    type === "reel"
      ? firstDefined<number>(raw.videoPlayCount, raw.igPlayCount, raw.videoViewCount, raw.playsCount) ?? null
      : null;
  const timestampRaw = firstDefined<string | number>(raw.timestamp, raw.takenAt, raw.taken_at_timestamp);
  const postedAt = timestampRaw ? new Date(typeof timestampRaw === "number" && timestampRaw < 2e10 ? timestampRaw * 1000 : timestampRaw).toISOString() : new Date().toISOString();
  const shortCode = firstDefined<string>(raw.shortCode, raw.code) ?? "";
  const permalink = firstDefined<string>(raw.url) ?? `https://www.instagram.com/${type === "reel" ? "reel" : "p"}/${shortCode}/`;
  const decorRand = mulberry32(hashString(`live-decor|${id}`));
  const engagementRate = followersCount ? Number((((likes + comments) / followersCount) * 100).toFixed(2)) : NaN;

  return {
    id,
    type,
    format: guessFormat(raw, type),
    caption: (firstDefined<string>(raw.caption) ?? "").trim() || "(без подписи)",
    postedAt,
    likes,
    comments,
    shares: 0,
    saves: NaN, // Instagram не отдаёт число сохранений публично ни через один открытый источник — честно не показываем выдуманное число
    views,
    engagementRate,
    hook: pick(decorRand, niche.hooks),
    gradient: pick(decorRand, GRADIENTS),
    emoji: pick(decorRand, HOOK_EMOJIS),
    permalink,
  };
}

export async function fetchLiveContent(username: string, type: "post" | "reel", limit: number, niche: ReturnType<typeof detectNiche>, followersCount: number | null): Promise<ContentItem[] | null> {
  try {
    const items = await runApifyActor<RawItem>(CONTENT_ACTOR, {
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: type === "reel" ? "reels" : "posts",
      resultsLimit: limit,
    });
    if (!items.length) return null;
    const mapped = items.slice(0, limit).map((raw, i) => mapRawItem(raw, type, i, niche, followersCount));
    mapped.sort((a, b) => (type === "reel" ? (b.views ?? 0) - (a.views ?? 0) : b.likes - a.likes));
    return mapped;
  } catch (err) {
    console.warn(`[live] Не удалось получить ${type === "reel" ? "Reels" : "посты"} @${username}:`, err instanceof ApifyError ? err.message : err);
    return null;
  }
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HOURS = [9, 12, 15, 18, 21];

function nearestHourBucket(hour: number): number {
  return HOURS.reduce((closest, h) => (Math.abs(h - hour) < Math.abs(closest - hour) ? h : closest), HOURS[0]);
}

function buildHeatmapFromRealPosts(items: ContentItem[]): { heatmap: DayHour[]; bestSlots: string[] } {
  const counts = new Map<string, number>();
  for (const day of DAYS) for (const hour of HOURS) counts.set(`${day}|${hour}`, 0);

  for (const item of items) {
    const d = new Date(item.postedAt);
    const jsDay = d.getUTCDay(); // 0=Sun..6=Sat
    const day = DAYS[(jsDay + 6) % 7]; // remap so Monday=0
    const hour = nearestHourBucket(d.getUTCHours());
    const key = `${day}|${hour}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const max = Math.max(1, ...Array.from(counts.values()));
  const heatmap: DayHour[] = [];
  for (const day of DAYS) {
    for (const hour of HOURS) {
      const raw = counts.get(`${day}|${hour}`) ?? 0;
      heatmap.push({ day, hour, value: Number((0.15 + (raw / max) * 0.85).toFixed(2)) });
    }
  }
  const bestSlots = [...heatmap]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((p) => `${p.day} · ${p.hour}:00`);

  return { heatmap, bestSlots };
}

export function buildLiveReport(
  username: string,
  nicheInput: string,
  posts: ContentItem[],
  reels: ContentItem[],
  followersCount: number | null
): Report {
  const niche = detectNiche(nicheInput);
  const rand = mulberry32(hashString(`live-report|${username}|${niche.key}`));
  const all = [...posts, ...reels];

  const avgLikes = posts.length ? Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length) : 0;
  const avgComments = posts.length ? Math.round(posts.reduce((s, p) => s + p.comments, 0) / posts.length) : 0;
  const avgViews = reels.length ? Math.round(reels.reduce((s, r) => s + (r.views ?? 0), 0) / reels.length) : 0;

  const validER = all.map((i) => i.engagementRate).filter((v) => Number.isFinite(v));
  const engagementRate = validER.length ? Number((validER.reduce((s, v) => s + v, 0) / validER.length).toFixed(2)) : NaN;
  // Реального открытого источника "средней вовлечённости по нише" не существует — это ориентировочная
  // оценка (детерминированная по нише, чтобы не прыгала между запросами), а не измеренный показатель.
  const engagementBenchmark = randFloat(rand, 3.5, 5.5, 2);

  const formatTally = new Map<string, number>();
  for (const item of all) formatTally.set(item.format, (formatTally.get(item.format) ?? 0) + 1);
  const totalFormats = all.length || 1;
  const formatMix = Array.from(formatTally.entries())
    .map(([label, value]) => ({ label, value: Math.round((value / totalFormats) * 100) }))
    .sort((a, b) => b.value - a.value);

  const { heatmap, bestSlots } = buildHeatmapFromRealPosts(all.length ? all : posts);

  const hashtagTally = new Map<string, { count: number; likes: number }>();
  // hashtags не всегда приходят от актора — если их нет, топ хэштегов просто будет пуст
  for (const item of posts as (ContentItem & { hashtags?: string[] })[]) {
    const tags: string[] = (item as any).hashtags ?? [];
    for (const tag of tags) {
      const entry = hashtagTally.get(tag) ?? { count: 0, likes: 0 };
      entry.count += 1;
      entry.likes += item.likes;
      hashtagTally.set(tag, entry);
    }
  }
  const topHashtags = Array.from(hashtagTally.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([tag, v]) => ({ tag, avgLikes: Math.round(v.likes / v.count) }));
  if (topHashtags.length === 0) {
    // fallback на нишевые хэштеги, если реальные посты не содержали разметки
    for (const tag of pickMany(rand, niche.hashtags, Math.min(4, niche.hashtags.length))) {
      topHashtags.push({ tag, avgLikes: avgLikes || 0 });
    }
  }

  const topFormatLabel = formatMix[0]?.label ?? "Reels";
  const postInsights = [
    `Самый частый формат в топ-постах — «${topFormatLabel}» (${formatMix[0]?.value ?? 0}% от разобранных публикаций)`,
    `Средняя вовлечённость по разобранным публикациям — ${Number.isFinite(engagementRate) ? engagementRate + "%" : "н/д (не удалось оценить без числа подписчиков)"}`,
    `Лучший замеченный слот по фактическим датам публикаций — ${bestSlots[0] ?? "недостаточно данных"}`,
  ];
  const reelInsights = [
    `Ср. просмотры на Reels в разборе — ${avgViews ? avgViews.toLocaleString("ru-RU") : "н/д"}`,
    `Из ${reels.length} разобранных Reels самый залётный набрал ${reels[0]?.views?.toLocaleString("ru-RU") ?? "н/д"} просмотров`,
    `Данные по сохранениям Instagram не раскрывает публично ни для одного стороннего сервиса — этот показатель не отображается`,
  ];

  return {
    avgLikes,
    avgComments,
    avgViews,
    engagementRate,
    engagementBenchmark,
    postFrequencyPerWeek: 0,
    reelFrequencyPerWeek: 0,
    formatMix: formatMix.length ? formatMix : [{ label: "Нет данных", value: 100 }],
    growth: [], // реальная историческая динамика подписчиков недоступна ни в одном открытом источнике
    heatmap,
    bestSlots: bestSlots.length ? bestSlots : ["недостаточно данных"],
    topHashtags,
    postInsights,
    reelInsights,
  };
}

export async function buildLiveAnalysis(username: string, nicheInput: string) {
  const niche = detectNiche(nicheInput);

  const profile = await fetchLiveProfile(username);
  const followersCount = profile?.followersCount ?? null;

  const [posts, reels] = await Promise.all([
    fetchLiveContent(username, "post", 10, niche, followersCount),
    fetchLiveContent(username, "reel", 10, niche, followersCount),
  ]);

  if (!posts && !reels) return null; // ничего не получили — вызывающий код откатится на мок

  const finalPosts = posts ?? [];
  const finalReels = reels ?? [];
  const report = buildLiveReport(username, nicheInput, finalPosts, finalReels, followersCount);
  const checklist = generateChecklist(username, nicheInput);
  const ideas = generateIdeas(nicheInput, 10);

  return {
    posts: finalPosts,
    reels: finalReels,
    report,
    checklist,
    ideas,
    profile,
    partial: !posts || !reels,
  };
}
