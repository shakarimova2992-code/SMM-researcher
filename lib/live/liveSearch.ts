import { runApifyActor } from "./apify";
import { detectNiche } from "@/lib/mock/niches";
import { translit } from "@/lib/mock/translit";
import { mulberry32, hashString, pick } from "@/lib/mock/rng";
import { firstDefined, GRADIENTS } from "./liveEngine";
import type { AccountSummary } from "@/lib/mock/types";

// Реальный поиск топ-аккаунтов по нише+городу.
//
// ВАЖНО: у Instagram нет официального открытого поиска "по геолокации" —
// поэтому здесь это эмулируется через поиск постов по нишевым хэштегам
// (в т.ч. хэштег+город слитно, как реально пишут в постах, например
// #маникюрусткаменогорск), сбор уникальных авторов из найденных постов,
// и затем получение их профилей (подписчики и т.д.) одним пакетным
// вызовом. Это может не покрыть все реальные топ-аккаунты города — это
// приближение, а не точный гарантированный поиск, но данные (подписчики,
// био, посты) там, где они найдены — настоящие, не выдуманные.
//
// Как и в liveEngine.ts — поля ответа Apify не проверены живым вызовом
// из-за сетевых ограничений песочницы, где это писалось. Любая ошибка
// или пустой результат просто возвращает null, и вызывающий код (route.ts)
// откатывается на мок с честным предупреждением в интерфейсе.

const CONTENT_ACTOR = "apify~instagram-scraper";
const PROFILE_ACTOR = "apify~instagram-profile-scraper";

type RawItem = Record<string, any>;
type RawProfile = Record<string, any>;

function buildHashtagCandidates(niche: ReturnType<typeof detectNiche>, location: string): string[] {
  const citySlug = location ? translit(location) : "";
  const base = niche.hashtags.slice(0, 3);
  const withCity = citySlug ? base.map((tag) => `${tag}${citySlug}`) : [];
  // Сначала пробуем хэштег+город (точнее по локации), затем просто нишевые (шире охват)
  return [...withCity, ...base];
}

export async function searchLiveAccounts(nicheInput: string, location: string, count = 12): Promise<AccountSummary[] | null> {
  const niche = detectNiche(nicheInput);
  const candidates = buildHashtagCandidates(niche, location);

  const owners = new Map<string, RawItem>(); // username -> один найденный пост (для оценки ER)

  for (const tag of candidates) {
    if (owners.size >= count * 3) break; // насобирали достаточно кандидатов для отбора топа
    try {
      const items = await runApifyActor<RawItem>(CONTENT_ACTOR, {
        search: tag,
        searchType: "hashtag",
        searchLimit: 1,
        resultsType: "posts",
        resultsLimit: 30,
      });
      for (const item of items) {
        const owner = firstDefined<string>(item.ownerUsername, item.owner?.username, item.username);
        if (!owner || owners.has(owner)) continue;
        owners.set(owner, item);
      }
    } catch (err) {
      console.warn(`[live-search] Хэштег "${tag}" не сработал:`, err instanceof Error ? err.message : err);
    }
  }

  if (owners.size === 0) return null;

  const usernames = Array.from(owners.keys()).slice(0, Math.min(24, count * 3));

  let profiles: RawProfile[] = [];
  try {
    profiles = await runApifyActor<RawProfile>(PROFILE_ACTOR, { usernames });
  } catch (err) {
    console.warn("[live-search] Не удалось получить профили найденных аккаунтов:", err instanceof Error ? err.message : err);
    return null;
  }
  if (!profiles.length) return null;

  const accounts: AccountSummary[] = profiles
    .map((p): AccountSummary | null => {
      const username = firstDefined<string>(p.username, p.account) ?? "";
      if (!username) return null;
      const followers = firstDefined<number>(p.followersCount, p.followers, p.edge_followed_by?.count) ?? 0;
      const posts = firstDefined<number>(p.postsCount, p.mediaCount) ?? 0;
      const sample = owners.get(username);
      const likes = sample ? firstDefined<number>(sample.likesCount, sample.likes) : undefined;
      const comments = sample ? firstDefined<number>(sample.commentsCount, sample.comments) : undefined;
      const avgEngagementRate =
        likes !== undefined && comments !== undefined && followers
          ? Number((((likes + comments) / followers) * 100).toFixed(2))
          : NaN; // недостаточно данных для честной оценки — не выдумываем число

      const decorRand = mulberry32(hashString(`live-search-decor|${username}`));

      return {
        username,
        displayName: firstDefined<string>(p.fullName, p.full_name) || username,
        city: location || "—",
        followers,
        posts,
        avgEngagementRate,
        verified: Boolean(firstDefined<boolean>(p.verified, p.isVerified)),
        category: niche.label,
        bio: (firstDefined<string>(p.biography, p.bio) ?? "").trim() || `${niche.emoji} ${niche.label}`,
        gradient: pick(decorRand, GRADIENTS),
        rank: 0, // проставим после сортировки
      };
    })
    .filter((a): a is AccountSummary => a !== null);

  if (accounts.length === 0) return null;

  accounts.sort((a, b) => b.followers - a.followers);
  return accounts.slice(0, count).map((a, i) => ({ ...a, rank: i + 1 }));
}
