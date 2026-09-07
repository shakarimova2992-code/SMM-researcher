import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getUser, bindAccount } from "@/lib/db";
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

  const user = await getUser(email);
  if (user?.boundAccount && user.boundAccount !== username) {
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

  await bindAccount(email, username, niche);

  const posts = generateTopPosts(username, niche, 10);
  const reels = generateTopReels(username, niche, 10);
  const report = generateReport(username, niche);
  const checklist = generateChecklist(username, niche);
  const ideas = generateIdeas(niche, 10);

  return NextResponse.json({ ok: true, username, niche, posts, reels, report, checklist, ideas });
}
