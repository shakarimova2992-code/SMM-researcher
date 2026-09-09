import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getUser, bindAccount } from "@/lib/db";
import { isUnlimitedEmail } from "@/lib/config";
import { isLiveDataEnabled } from "@/lib/live/apify";
import { buildLiveAnalysis } from "@/lib/live/liveEngine";
import {
  generateTopPosts,
  generateTopReels,
  generateReport,
  generateChecklist,
  generateIdeas,
} from "@/lib/mock/engine";

export async function POST(req: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Требуется вход" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const niche = String(body?.niche ?? "").trim();

  if (!username || !niche) {
    return NextResponse.json({ ok: false, error: "Не хватает данных аккаунта" }, { status: 400 });
  }

  const unlimited = isUnlimitedEmail(email);
  const user = await getUser(email);
  if (!unlimited && user?.boundAccount && user.boundAccount !== username) {
    return NextResponse.json(
      {
        ok: false,
        error: "account_locked",
        message: `Ваша ссылка уже привязана к аккаунту @${user.boundAccount}. По одной ссылке доступен анализ только одного аккаунта.`,
        boundAccount: user.boundAccount,
      },
      { status: 403 }
    );
  }

  // Тестовые аккаунты из UNLIMITED_EMAILS не привязываются к первому же
  // проанализированному username — им можно проверять сколько угодно аккаунтов.
  if (!unlimited) {
    await bindAccount(email, username, niche);
  }

  // Если задан APIFY_API_TOKEN — пробуем получить реальные данные Instagram.
  // Любая ошибка/пустой ответ (сеть, приватный аккаунт, несуществующий username,
  // исчерпанный лимит Apify) тихо для пользователя откатывается на мок-генератор,
  // но помечается в ответе через dataSource/warning, чтобы интерфейс мог честно
  // показать, какие данные он видит.
  if (isLiveDataEnabled()) {
    try {
      const live = await buildLiveAnalysis(username, niche);
      if (live) {
        return NextResponse.json({
          ok: true,
          username,
          niche,
          posts: live.posts,
          reels: live.reels,
          report: live.report,
          checklist: live.checklist,
          ideas: live.ideas,
          dataSource: "live",
          warning: live.partial
            ? "Удалось получить только часть данных (посты или Reels) — остальное показано как «нет данных», ничего не выдумываем."
            : null,
        });
      }
    } catch (err) {
      console.warn(`[analyze] Живые данные для @${username} не получены, откат на мок:`, err instanceof Error ? err.message : err);
    }
  }

  const posts = generateTopPosts(username, niche, 10);
  const reels = generateTopReels(username, niche, 10);
  const report = generateReport(username, niche);
  const checklist = generateChecklist(username, niche);
  const ideas = generateIdeas(niche, 10);

  return NextResponse.json({
    ok: true,
    username,
    niche,
    posts,
    reels,
    report,
    checklist,
    ideas,
    dataSource: "mock",
    warning: isLiveDataEnabled()
      ? "Не удалось получить реальные данные этого аккаунта (закрытый профиль, неверный username или недоступен сервис-парсер) — показан демонстрационный мок-пример."
      : null,
  });
}
