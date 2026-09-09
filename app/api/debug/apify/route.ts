import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { runApifyActor, ApifyError, isLiveDataEnabled } from "@/lib/live/apify";

// Диагностический эндпоинт: делает НАСТОЯЩИЙ минимальный вызов обоих Apify-акторов
// и возвращает сырой результат/ошибку прямо в JSON — вместо того чтобы прятать её
// в серверных логах (console.warn), которые никто не видит. Нужен, чтобы наконец
// увидеть ТОЧНУЮ причину, почему живой поиск проваливается: неверная схема входа,
// закончились кредиты Apify, актор переименован/недоступен, блокировка/капча,
// или просто 0 совпадений по хэштегу.
//
// Использование: GET /api/debug/apify?hashtag=маникюр&username=instagram
// (оба параметра необязательны, есть безопасные значения по умолчанию)
//
// Можно удалить вместе с /api/debug после того как разберёмся с поиском.

export const maxDuration = 45;

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

export async function GET(req: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Требуется вход" }, { status: 401 });
  }

  if (!isLiveDataEnabled()) {
    return NextResponse.json({ ok: false, error: "APIFY_API_TOKEN не задан на сервере" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const hashtag = searchParams.get("hashtag") || "маникюр";
  const username = searchParams.get("username") || "instagram";

  const [contentResult, profileResult] = await Promise.allSettled([
    runApifyActor<Record<string, any>>("apify~instagram-scraper", {
      search: hashtag,
      searchType: "hashtag",
      searchLimit: 1,
      resultsType: "posts",
      resultsLimit: 5,
    }),
    runApifyActor<Record<string, any>>("apify~instagram-profile-scraper", {
      usernames: [username],
    }),
  ]);

  const contentReport =
    contentResult.status === "fulfilled"
      ? {
          ok: true,
          itemCount: contentResult.value.length,
          firstItemKeys: contentResult.value[0] ? Object.keys(contentResult.value[0]) : [],
          firstItemSample: contentResult.value[0]
            ? {
                ownerUsername: contentResult.value[0].ownerUsername ?? contentResult.value[0].owner?.username ?? contentResult.value[0].username ?? null,
                likesCount: contentResult.value[0].likesCount ?? contentResult.value[0].likes ?? null,
                type: contentResult.value[0].type ?? null,
              }
            : null,
        }
      : { ok: false, ...describeError(contentResult.reason) };

  const profileReport =
    profileResult.status === "fulfilled"
      ? {
          ok: true,
          itemCount: profileResult.value.length,
          firstItemKeys: profileResult.value[0] ? Object.keys(profileResult.value[0]) : [],
          firstItemSample: profileResult.value[0]
            ? {
                username: profileResult.value[0].username ?? null,
                followersCount: profileResult.value[0].followersCount ?? profileResult.value[0].followers ?? null,
                biography: (profileResult.value[0].biography ?? profileResult.value[0].bio ?? "").slice(0, 120),
              }
            : null,
        }
      : { ok: false, ...describeError(profileResult.reason) };

  return NextResponse.json({
    ok: true,
    testedAt: new Date().toISOString(),
    inputUsed: { hashtag, username },
    contentActor: { actorId: "apify~instagram-scraper", ...contentReport },
    profileActor: { actorId: "apify~instagram-profile-scraper", ...profileReport },
  });
}
