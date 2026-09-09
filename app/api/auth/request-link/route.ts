import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";
import { createMagicLinkToken } from "@/lib/session";
import { sendMagicLinkEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Введите корректный email" }, { status: 400 });
  }

  // Файловая "БД" пользователя — best-effort: на serverless она может не
  // сохраниться до следующего запроса (см. комментарий в lib/session.ts),
  // но сам вход по ссылке от этого больше не зависит, поэтому ошибку записи
  // здесь не считаем фатальной.
  try {
    await upsertUser(email);
  } catch (err) {
    console.warn("[auth] upsertUser не удался (не критично):", err instanceof Error ? err.message : err);
  }

  const token = await createMagicLinkToken(email);

  const origin = req.nextUrl.origin;
  const link = `${origin}/api/auth/verify?token=${token}`;

  const { devMode } = await sendMagicLinkEmail(email, link);

  return NextResponse.json({
    ok: true,
    message: devMode
      ? "Почтовый провайдер не подключён (демо-режим) — используйте ссылку ниже, чтобы войти"
      : "Ссылка для входа отправлена на почту",
    devMode,
    link: devMode ? link : undefined,
  });
}
