import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { upsertUser, createToken } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Введите корректный email" }, { status: 400 });
  }

  await upsertUser(email);
  const token = nanoid(32);
  await createToken(email, token, TOKEN_TTL_MS);

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
