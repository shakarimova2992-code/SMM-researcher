import { runApifyActor } from "./apify";
import { detectNiche } from "@/lib/mock/niches";
import { translit, translitLoose } from "@/lib/mock/translit";
import { mulberry32, hashString, pick } from "@/lib/mock/rng";
import { firstDefined, GRADIENTS } from "./liveEngine";
import type { AccountSummary } from "@/lib/mock/types";

// Реальный поиск топ-аккаунтов по нише+городу.
//
// ВАЖНО: у Instagram нет официального открытого поиска "по геолокации" —
// поэтому здесь это делается в два шага:
//  1) discovery — поиск постов по нишевым хэштегам (в т.ч. хэштег+город слитно,
//     как реально пишут в постах, например #маникюрусткаменогорск), сбор
//     уникальных авторов найденных постов;
//  2) verification — у каждого найденного автора берём настоящий профиль
//     (шапка бизнес-аккаунта/адрес + текст био) и проверяем, упоминается ли
//     там сам город. Аккаунты с подтверждённым городом идут в выдаче выше
//     неподтверждённых — это гораздо надёжнее одних только хэштегов.
// Это по-прежнему приближение, а не гарантированный полный охват города, но
// данные (подписчики, био, посты) там, где они найдены — настоящие.
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

// Токены для проверки города по тексту профиля: сама фраза как есть (кириллица)
// и её транслитерация (на случай, если профиль/адрес указан латиницей). Плюс
// укороченная "основа" слова — чтобы пережить падежные окончания в би́о
// ("...в Усть-Каменогорске", "Ust-Kamenogorske" и т.п.).
function buildCityMatchTokens(location: string): string[] {
  const trimmed = location.trim().toLowerCase();
  if (!trimmed) return [];
  const lat = translitLoose(trimmed);
  const stem = (s: string) => (s.length > 6 ? s.slice(0, s.length - 2) : s);
  return Array.from(new Set([trimmed, stem(trimmed), lat, stem(lat)])).filter((t) => t.length >= 3);
}

function profileMentionsCity(profile: RawProfile, cityTokens: string[]): boolean {
  if (cityTokens.length === 0) return false;
  const fields = [
    firstDefined<string>(profile.biography, profile.bio),
    firstDefined<string>(
      profile.businessAddress,
      profile.address,
      profile.city,
      profile.businessAddressJson?.city_name,
      profile.businessAddressJson?.street_address
    ),
  ].filter(Boolean) as string[];
  if (fields.length === 0) return false;

  const haystackCyr = fields.join(" ").toLowerCase();
  const haystackLat = translitLoose(haystackCyr);
  return cityTokens.some((t) => haystackCyr.includes(t) || haystackLat.includes(t));
}

export async function searchLiveAccounts(nicheInput: string, location: string, count = 12): Promise<AccountSummary[] | null> {
  const niche = detectNiche(nicheInput);
  const candidates = buildHashtagCandidates(niche, location);
  const cityTokens = buildCityMatchTokens(location);

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
      const locationVerified = cityTokens.length > 0 ? profileMentionsCity(p, cityTokens) : undefined;

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
        locationVerified,
      };
    })
    .filter((a): a is AccountSummary => a !== null);

  if (accounts.length === 0) return null;

  // Подтверждённые по профилю (город реально упомянут в адресе/био) — выше,
  // внутри каждой группы — по числу подписчиков.
  accounts.sort((a, b) => {
    const aVerified = a.locationVerified ? 1 : 0;
    const bVerified = b.locationVerified ? 1 : 0;
    if (aVerified !== bVerified) return bVerified - aVerified;
    return b.followers - a.followers;
  });

  return accounts.slice(0, count).map((a, i) => ({ ...a, rank: i + 1 }));
}
