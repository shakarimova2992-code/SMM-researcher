import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { generateAccounts } from "@/lib/mock/engine";
import { isLiveDataEnabled } from "@/lib/live/apify";
import { searchLiveAccounts } from "@/lib/live/liveSearch";

export async function POST(req: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Требуется вход" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const niche = String(body?.niche ?? "").trim();
  const location = String(body?.location ?? "").trim();

  if (!niche) {
    return NextResponse.json({ ok: false, error: "Укажите нишу" }, { status: 400 });
  }

  // Если подключён Apify — сначала пробуем найти настоящие аккаунты (через нишевые
  // хэштеги + город, см. lib/live/liveSearch.ts). Любая ошибка/пустой результат —
  // тихий откат на мок с честной пометкой в интерфейсе, ничего не падает.
  if (isLiveDataEnabled()) {
    try {
      const liveAccounts = await searchLiveAccounts(niche, location, 12);
      if (liveAccounts && liveAccounts.length > 0) {
        return NextResponse.json({ ok: true, accounts: liveAccounts, niche, location, dataSource: "live" });
      }
    } catch (err) {
      console.warn(`[search] Живой поиск не удался, откат на мок:`, err instanceof Error ? err.message : err);
    }
  }

  const accounts = generateAccounts(niche, location, 12);
  return NextResponse.json({
    ok: true,
    accounts,
    niche,
    location,
    dataSource: "mock",
    warning: isLiveDataEnabled()
      ? "Не удалось найти реальные аккаунты по этому запросу (слишком узкая ниша/город или недоступен сервис-парсер) — показан демонстрационный пример."
      : null,
  });
}
