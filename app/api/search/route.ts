import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { generateAccounts } from "@/lib/mock/engine";

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

  const accounts = generateAccounts(niche, location, 12);
  return NextResponse.json({ ok: true, accounts, niche, location });
}
