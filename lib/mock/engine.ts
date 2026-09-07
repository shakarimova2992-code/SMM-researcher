import { mulberry32, hashString, pick, pickMany, randInt, randFloat } from "./rng";
import { detectNiche, NicheProfile } from "./niches";
import { translit, slugify } from "./translit";
import type { AccountSummary, ContentItem, Report, ChecklistItem, IdeaItem, DayHour } from "./types";

const WORD_BANKS: Record<string, string[]> = {
  "маникюр": ["nail", "beauty", "nails", "manicure", "glam"],
  "кофейн": ["coffee", "brew", "cup", "roast", "espresso"],
  "фитнес": ["fit", "gym", "power", "train", "body"],
  "стоматолог": ["dental", "smile", "teeth", "dent"],
  "ремонт": ["remont", "build", "interior", "reno"],
  "доставка еды": ["food", "eat", "box", "kitchen"],
  "детск": ["kids", "baby", "little", "mini"],
  "психолог": ["mind", "psy", "calm", "soul"],
  "автосервис": ["auto", "moto", "garage", "wheels"],
  "недвиж": ["realty", "homes", "estate", "key"],
  "generic": ["studio", "pro", "hub", "brand"],
};

const GRADIENTS: [string, string][] = [
  ["#8226ff", "#ff3d7f"],
  ["#ff5f6d", "#ffb703"],
  ["#3df2c0", "#8226ff"],
  ["#ff8a5c", "#8226ff"],
  ["#ffd166", "#ff3d7f"],
  ["#6d0fe0", "#3df2c0"],
  ["#ff3d7f", "#ffb703"],
  ["#9750ff", "#ff8a5c"],
];

const NAME_PREFIXES = ["studio", "art", "pro", "lab", "house", "space", "point", "loft"];

function wordBank(niche: NicheProfile): string[] {
  return WORD_BANKS[niche.key] ?? WORD_BANKS.generic;
}

function buildUsername(rand: () => number, niche: NicheProfile, citySlug: string, index: number): string {
  const words = wordBank(niche);
  const word = pick(rand, words);
  const style = randInt(rand, 0, 3);
  const suffixNum = randInt(rand, 2, 999);
  switch (style) {
    case 0:
      return `${word}.${citySlug}`;
    case 1:
      return `${word}_${pick(rand, NAME_PREFIXES)}`;
    case 2:
      return `${citySlug}.${word}${suffixNum}`;
    default:
      return `${word}${suffixNum}`;
  }
}

function buildDisplayName(rand: () => number, niche: NicheProfile, city: string): string {
  const templates = [
    `${niche.emoji} ${niche.label.split(" ")[0]} | ${city}`,
    `${niche.emoji} ${cap(pick(rand, niche.services))}`,
    `${niche.label.split(" ")[0]} Studio ${city}`,
  ];
  return pick(rand, templates);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function followersForRank(rand: () => number, rank: number, total: number): number {
  // Первые места — заметно крупнее (степенное распределение), дальше выравнивается
  const base = 250000 * Math.pow(1 - rank / (total + 2), 2.4);
  const noise = randFloat(rand, 0.85, 1.15);
  return Math.max(600, Math.round(base * noise));
}

export function generateAccounts(nicheInput: string, location: string, count = 12): AccountSummary[] {
  const niche = detectNiche(nicheInput);
  const city = location.trim() || "вашем городе";
  const citySlug = slugify(location || "city") || "city";
  const seedKey = `accounts|${niche.key}|${nicheInput.toLowerCase()}|${location.toLowerCase()}`;
  const rand = mulberry32(hashString(seedKey));

  const raw = Array.from({ length: count }).map((_, i) => {
    const followers = followersForRank(rand, i, count);
    return { i, followers };
  });
  raw.sort((a, b) => b.followers - a.followers);

  return raw.map(({ i, followers }, rankIdx) => {
    const localRand = mulberry32(hashString(`${seedKey}|${i}`));
    const username = buildUsername(localRand, niche, citySlug, i);
    const displayName = buildDisplayName(localRand, niche, city);
    const posts = randInt(localRand, 40, 1400);
    const avgEngagementRate = randFloat(localRand, 1.2, 8.5, 2);
    return {
      username,
      displayName,
      city,
      followers,
      posts,
      avgEngagementRate,
      verified: followers > 60000 && localRand() > 0.5,
      category: niche.label,
      bio: `${niche.emoji} ${cap(pick(localRand, niche.services))} · ${city}`,
      gradient: pick(localRand, GRADIENTS),
      rank: rankIdx + 1,
    };
  });
}

function captionFor(rand: () => number, niche: NicheProfile, hook: string): string {
  const service = pick(rand, niche.services);
  const templates = [
    `${cap(hook)}: как это выглядит на практике — ${service}`,
    `Реальный кейс: ${service}. Смотрите до конца 👀`,
    `${cap(hook)} на примере нашей работы (${service})`,
    `Отвечаем на вопрос, который задают чаще всего про «${service}»`,
  ];
  return pick(rand, templates);
}

function generateContentList(
  username: string,
  nicheInput: string,
  type: "post" | "reel",
  count: number
): ContentItem[] {
  const niche = detectNiche(nicheInput);
  const seedKey = `${type}|${username}|${niche.key}`;
  const rand = mulberry32(hashString(seedKey));
  const formats = type === "post" ? ["Карусель", "Одно фото", "Карусель"] : ["Reels"];
  const emojis = ["🔥", "✨", "💡", "📈", "🎯", "💬", "🎬", "🏆"];

  const items: ContentItem[] = Array.from({ length: count }).map((_, i) => {
    const itemRand = mulberry32(hashString(`${seedKey}|${i}`));
    const hook = pick(itemRand, niche.hooks);
    const likes =
      type === "post"
        ? randInt(itemRand, 300, 18000)
        : randInt(itemRand, 500, 40000);
    const views = type === "reel" ? Math.round(likes * randFloat(itemRand, 9, 26, 1)) : null;
    const comments = Math.round(likes * randFloat(itemRand, 0.01, 0.06, 3));
    const shares = Math.round((views ?? likes) * randFloat(itemRand, 0.002, 0.02, 3));
    const saves = Math.round(likes * randFloat(itemRand, 0.03, 0.14, 3));
    const engagementRate = randFloat(itemRand, 2.5, 14, 2);
    const daysAgo = randInt(itemRand, 1, 75);
    const postedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    return {
      id: `${type}-${username}-${i}`,
      type,
      format: pick(itemRand, formats),
      caption: captionFor(itemRand, niche, hook),
      postedAt,
      likes,
      comments,
      shares,
      saves,
      views,
      engagementRate,
      hook: cap(hook),
      gradient: pick(itemRand, GRADIENTS),
      emoji: pick(itemRand, emojis),
    };
  });

  // Топ — сортируем по метрике вовлечённости (просмотры для рилс, лайки для постов)
  items.sort((a, b) => (type === "reel" ? (b.views ?? 0) - (a.views ?? 0) : b.likes - a.likes));
  return items;
}

export function generateTopPosts(username: string, nicheInput: string, count = 10): ContentItem[] {
  return generateContentList(username, nicheInput, "post", count);
}

export function generateTopReels(username: string, nicheInput: string, count = 10): ContentItem[] {
  return generateContentList(username, nicheInput, "reel", count);
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function generateReport(username: string, nicheInput: string): Report {
  const niche = detectNiche(nicheInput);
  const rand = mulberry32(hashString(`report|${username}|${niche.key}`));

  const posts = generateTopPosts(username, nicheInput, 10);
  const reels = generateTopReels(username, nicheInput, 10);

  const avgLikes = Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length);
  const avgComments = Math.round(posts.reduce((s, p) => s + p.comments, 0) / posts.length);
  const avgViews = Math.round(reels.reduce((s, r) => s + (r.views ?? 0), 0) / reels.length);
  const engagementRate = randFloat(rand, 2.2, 9.8, 2);
  const engagementBenchmark = randFloat(rand, 3.5, 5.5, 2);

  const heatmap: DayHour[] = [];
  for (const day of DAYS) {
    for (const hour of [9, 12, 15, 18, 21]) {
      heatmap.push({ day, hour, value: randFloat(rand, 0.1, 1, 2) });
    }
  }
  const bestPairs = [...heatmap].sort((a, b) => b.value - a.value).slice(0, 3);
  const bestSlots = bestPairs.map((p) => `${p.day} · ${p.hour}:00`);

  const formatMix = [
    { label: "Reels", value: randInt(rand, 35, 55) },
    { label: "Карусели", value: randInt(rand, 20, 35) },
    { label: "Фото", value: randInt(rand, 10, 25) },
  ];
  const total = formatMix.reduce((s, f) => s + f.value, 0);
  formatMix.forEach((f) => (f.value = Math.round((f.value / total) * 100)));

  const growth = Array.from({ length: 6 }).map((_, i) => {
    const monthNames = ["Апр", "Май", "Июн", "Июл", "Авг", "Сен"];
    const base = randInt(rand, 500, 4000);
    return { month: monthNames[i], followers: base * (i + 1) + randInt(rand, -300, 800) };
  });

  const topHashtags = pickMany(rand, niche.hashtags, Math.min(4, niche.hashtags.length)).map((tag) => ({
    tag,
    avgLikes: randInt(rand, 800, 15000),
  }));

  const postInsights = [
    `Карусели из 5+ слайдов набирают в среднем на ${randInt(rand, 20, 60)}% больше сохранений, чем одиночные фото`,
    `Посты с формулой «${pick(rand, niche.hooks)}» стабильно попадают в топ по лайкам`,
    `Подписи короче 150 символов получают на ${randInt(rand, 10, 35)}% больше комментариев`,
  ];
  const reelInsights = [
    `Reels длиной 7–15 секунд удерживают досмотр выше ${randInt(rand, 55, 80)}%`,
    `Ролики, опубликованные в слот ${bestSlots[0]}, набирают просмотров в среднем в ${randFloat(rand, 1.4, 2.6, 1)}x больше`,
    `Формат «${pick(rand, niche.hooks)}» — самый воспроизводимый паттерн среди топ-10 рилс`,
  ];

  return {
    avgLikes,
    avgComments,
    avgViews,
    engagementRate,
    engagementBenchmark,
    postFrequencyPerWeek: randInt(rand, 1, 5),
    reelFrequencyPerWeek: randInt(rand, 1, 6),
    formatMix,
    growth,
    heatmap,
    bestSlots,
    topHashtags,
    postInsights,
    reelInsights,
  };
}

const PROBLEM_LIBRARY: { severity: ChecklistItem["severity"]; title: string; problem: string; fix: string }[] = [
  {
    severity: "critical",
    title: "Нестабильная частота публикаций Reels",
    problem: "Между роликами бывают паузы по 7–10 дней — алгоритм теряет аккаунт из выдачи рекомендаций",
    fix: "Зафиксировать минимум 3 Reels в неделю по расписанию, снимать сериями по 4-5 роликов на один съёмочный день",
  },
  {
    severity: "critical",
    title: "Слабый призыв к действию в описании",
    problem: "В топ-10 постах нет чёткого CTA — подписчик не понимает, что делать дальше",
    fix: "Добавлять один конкретный CTA в каждый пост: «напиши в директ», «сохрани, чтобы не потерять», «запишись по ссылке в шапке»",
  },
  {
    severity: "warning",
    title: "Разнородный визуальный стиль",
    problem: "Обложки Reels и фото постов используют разную цветовую палитру — лента выглядит несобрано",
    fix: "Собрать 3–4 фирменных цвета и 1-2 шаблона обложек, использовать их во всех новых публикациях",
  },
  {
    severity: "warning",
    title: "Мало пользовательского контента и отзывов",
    problem: "В топ-публикациях почти нет реальных отзывов и историй клиентов — это снижает доверие новой аудитории",
    fix: "Раз в неделю публиковать формат «отзыв/результат клиента» с реальными деталями",
  },
  {
    severity: "opportunity",
    title: "Не используется формат «до/после»",
    problem: "Формат с высокой конверсией в сохранения почти не встречается в ленте",
    fix: "Добавить рубрику «до/после» минимум 1 раз в неделю — это один из самых воспроизводимых форматов в нише",
  },
  {
    severity: "opportunity",
    title: "Хэштеги не выровнены с нишей",
    problem: "Часть хэштегов слишком общие и не приводят целевую аудиторию",
    fix: "Заменить общие хэштеги на нишевые + гео-хэштеги города — это точнее попадает в целевую аудиторию",
  },
  {
    severity: "warning",
    title: "Долгий отклик в комментариях",
    problem: "На часть комментариев под топ-постами нет ответа от аккаунта дольше суток",
    fix: "Выделить 15 минут дважды в день на ответы — это напрямую влияет на охваты следующих публикаций",
  },
];

export function generateChecklist(username: string, nicheInput: string): ChecklistItem[] {
  const niche = detectNiche(nicheInput);
  const rand = mulberry32(hashString(`checklist|${username}|${niche.key}`));
  const picked = pickMany(rand, PROBLEM_LIBRARY, 6);
  return picked.map((p, i) => ({ id: `check-${i}`, ...p }));
}

const IDEA_TEMPLATES = [
  { title: "До/после: результат за {n} дней", format: "Reels" as const, trend: "🔥 Горячий тренд" },
  { title: "Разбор {n} частых ошибок клиентов в теме «{service}»", format: "Карусель" as const, trend: "📈 Стабильно заходит" },
  { title: "День из жизни специалиста: {service} изнутри", format: "Reels" as const, trend: "🔥 Горячий тренд" },
  { title: "Отвечаю на вопросы подписчиков про {service}", format: "Reels" as const, trend: "💬 Вовлекает аудиторию" },
  { title: "Мифы про {service}, в которые пора перестать верить", format: "Карусель" as const, trend: "🧪 Экспериментальный" },
  { title: "Сравнение: дёшево vs дорого в нише «{niche}»", format: "Reels" as const, trend: "🔥 Горячий тренд" },
  { title: "Реальный отзыв клиента: путь от заявки до результата", format: "Пост" as const, trend: "📈 Стабильно заходит" },
  { title: "Топ-5 вопросов перед тем как выбрать {service}", format: "Карусель" as const, trend: "💬 Вовлекает аудиторию" },
  { title: "Закулисье: как готовится {service}", format: "Reels" as const, trend: "🧪 Экспериментальный" },
  { title: "Тест на камеру: угадай результат «{service}»", format: "Reels" as const, trend: "🔥 Горячий тренд" },
  { title: "Чек-лист: как подготовиться к «{service}»", format: "Карусель" as const, trend: "📈 Стабильно заходит" },
  { title: "Реакция мастера на частую ошибку клиентов", format: "Reels" as const, trend: "💬 Вовлекает аудиторию" },
];

export function generateIdeas(nicheInput: string, count = 10): IdeaItem[] {
  const niche = detectNiche(nicheInput);
  const rand = mulberry32(hashString(`ideas|${niche.key}|${nicheInput.toLowerCase()}`));
  const picked = pickMany(rand, IDEA_TEMPLATES, Math.min(count, IDEA_TEMPLATES.length));

  return picked.map((tpl, i) => {
    const itemRand = mulberry32(hashString(`ideas|${niche.key}|${i}`));
    const service = pick(itemRand, niche.services);
    const n = randInt(itemRand, 7, 30);
    const title = tpl.title
      .replace("{n}", String(n))
      .replace("{service}", service)
      .replace("{niche}", niche.label.toLowerCase());
    return {
      id: `idea-${i}`,
      rank: i + 1,
      title: cap(title),
      format: tpl.format,
      trendLabel: tpl.trend,
      why: `Формат хорошо адаптируется под «${niche.label}» и перекликается с паттерном «${pick(itemRand, niche.hooks)}», который уже залетал в нише`,
      hook: cap(pick(itemRand, niche.hooks)),
    };
  });
}

export { detectNiche };
export type { NicheProfile };
