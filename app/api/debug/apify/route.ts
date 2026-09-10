import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { runApifyActor, ApifyError, isLiveDataEnabled } from "@/lib/live/apify";

// Диагностика идеи: искать организации по нише+городу через 2ГИС (у него
// есть настоящая привязка к конкретному городу — в отличие от хэштегов
// Instagram) и вытаскивать из карточек организаций ссылку на Instagram.
// Проверяем реальным вызовом, действительно ли актор возвращает Instagram-
// ссылки для организаций в конкретном (не только российском/крупном) городе.
//
// ВАЖНО: первая версия этой диагностики делала два вызова к 2ГИС ПО ОЧЕРЕДИ
// (await один за другим) — 2ГИС-скрейперы реально сканируют страницы и
// медленнее, чем Instagram-акторы, поэтому суммарное время легко превышало
// лимит выполнения функции и Vercel обрывал запрос по 504 до того, как мы
// сами успевали корректно прерваться. Теперь оба вызова идут параллельно
// с увеличенным индивидуальным таймаутом.
//
// Использование: GET /api/debug/apify?query=маникюр&city=Усть-Каменогорск

export const maxDuration = 120;
const TWOGIS_TIMEOUT_MS = 90_000;

function describeError(err: unknown): { message: string; cause?: string } {
  if (err instanceof ApifyError) {
    const causeStr =
      err.cause instanceof Error
        ? err.cause.message
        : err.cause
        ? String(err.cause).slice(0, 500)
        : undefined;
    return { message: err.message, cause: causeStr };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: String(err) };
}

function pickInstagramLink(item: Record<string, any>): string | null {
  const candidates: string[] = [];
  if (typeof item.website === "string") candidates.push(item.website);
  if (typeof item.socialLinks === "string") candidates.push(item.socialLinks);
  if (item.socials && typeof item.socials === "object") {
    for (const v of Object.values(item.socials)) {
      if (Array.isArray(v)) candidates.push(...v.map(String));
      else if (typeof v === "string") candidates.push(v);
    }
  }
  const found = candidates.find((c) => /instagram\.com/i.test(c));
  return found ?? null;
}

function summarizeItems(items: Record<string, any>[], actorId: string) {
  const withInstagram: (Record<string, any> & { __instagramFound: string | null })[] = items.map((it) => ({
    ...it,
    __instagramFound: pickInstagramLink(it),
  }));
  return {
    ok: true as const,
    actorId,
    itemCount: items.length,
    firstItemKeys: items[0] ? Object.keys(items[0]) : [],
    itemsWithInstagram: withInstagram.filter((it) => it.__instagramFound).length,
    sample: withInstagram.slice(0, 5).map((it) => ({
      name: it.name ?? it.title ?? null,
      website: it.website ?? null,
      socialLinks: it.socialLinks ?? null,
      socials: it.socials ?? null,
      instagramFound: it.__instagramFound,
      address: it.address ?? null,
    })),
  };
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Требуется вход" }, { status: 401 });
  }
  if (!isLiveDataEnabled()) {
    return NextResponse.json({ ok: false, error: "APIFY_API_TOKEN не задан на сервере" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "маникюр";
  const city = searchParams.get("city") || "Усть-Каменогорск";

  const [tugelbayResult, mamaevResult] = await Promise.allSettled([
    runApifyActor<Record<string, any>>("tugelbay~2gis-scraper", { query, city, maxItems: 10 }, TWOGIS_TIMEOUT_MS),
    runApifyActor<Record<string, any>>(
      "m_mamaev~2gis-places-scraper",
      { searchQueries: [query], location: city, maxItems: 10 },
      TWOGIS_TIMEOUT_MS
    ),
  ]);

  const tugelbay2gis =
    tugelbayResult.status === "fulfilled"
      ? summarizeItems(tugelbayResult.value, "tugelbay~2gis-scraper")
      : { ok: false, actorId: "tugelbay~2gis-scraper", ...describeError(tugelbayResult.reason) };

  const mamaev2gis =
    mamaevResult.status === "fulfilled"
      ? summarizeItems(mamaevResult.value, "m_mamaev~2gis-places-scraper")
      : { ok: false, actorId: "m_mamaev~2gis-places-scraper", ...describeError(mamaevResult.reason) };

  return NextResponse.json({
    ok: true,
    testedAt: new Date().toISOString(),
    inputUsed: { query, city },
    tugelbay2gis,
    mamaev2gis,
  });
}
