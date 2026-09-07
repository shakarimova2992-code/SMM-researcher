import { NextRequest, NextResponse } from "next/server";
import { resetAccount } from "@/lib/db";

// Служебный эндпоинт поддержки: сбросить привязку аккаунта пользователю.
// Не вызывается из интерфейса — используется вручную с ADMIN_KEY, если клиенту
// нужно поменять анализируемый Instagram-аккаунт по ссылке.
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }

  const user = await resetAccount(email);
  return NextResponse.json({ ok: true, user });
}
