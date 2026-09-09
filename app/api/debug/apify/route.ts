import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { runApifyActor, ApifyError, isLiveDataEnabled } from "@/lib/live/apify";

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

function summarizeResult(result: PromiseSettledResult<Record<string, any>[]>) {
  if (result.status === "rejected") {
    return { ok: false, ...describeError(result.reason) };
  }
  const items = result.value;
  const first = items[0];
  return {
    ok: true,
    itemCount: items.length,
    firstItemKeys: first ? Object.keys(first) : [],
    firstItemSample: first
      ? {
          ownerUsername: first.ownerUsername ?? first.owner?.username ?? first.username ?? null,
          likesCount: first.likesCount ?? first.likes ?? null,
          type: first.type ?? null,
          caption: typeof first.caption === "string" ? first.caption.slice(0, 80) : null,
        }
      : null,
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
  const hashtag = (searchParams.get("hashtag") || "маникюр").replace(/^#/, "");
  const username = searchParams.get("username") || "instagram";

  const [directUrlResult, hashtagActorResult, profileResult] = await Promise.allSettled([
    runApifyActor<Record<string, any>>("apify~instagram-scraper", {
      directUrls: [`https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`],
      resultsType: "posts",
      resultsLimit: 5,
    }),
    runApifyActor<Record<string, any>>("apify~instagram-hashtag-scraper", {
      hashtags: [hashtag],
      resultsType: "posts",
      resultsLimit: 5,
    }),
    runApifyActor<Record<string, any>>("apify~instagram-profile-scraper", {
      usernames: [username],
    }),
  ]);

  const profileReport =
    profileResult.status === "fulfilled"
      ? {
          ok: true,
          itemCount: profileResult.value.length,
          firstItemSample: profileResult.value[0]
            ? {
                username: profileResult.value[0].username ?? null,
                followersCount: profileResult.value[0].followersCount ?? profileResult.value[0].followers ?? null,
              }
            : null,
        }
      : { ok: false, ...describeError(profileResult.reason) };

  return NextResponse.json({
    ok: true,
    testedAt: new Date().toISOString(),
    inputUsed: { hashtag, username },
    directUrlsApproach: {
      actorId: "apify~instagram-scraper",
      inputSent: { directUrls: [`https://www.instagram.com/explore/tags/${hashtag}/`], resultsType: "posts", resultsLimit: 5 },
      ...summarizeResult(directUrlResult),
    },
    hashtagScraperApproach: {
      actorId: "apify~instagram-hashtag-scraper",
      inputSent: { hashtags: [hashtag], resultsType: "posts", resultsLimit: 5 },
      ...summarizeResult(hashtagActorResult),
    },
    profileActor: { actorId: "apify~instagram-profile-scraper", ...profileReport },
  });
}
