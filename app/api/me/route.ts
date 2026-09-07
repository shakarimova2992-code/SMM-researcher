import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getUser } from "@/lib/db";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const user = await getUser(email);
  return NextResponse.json({ ok: true, email, boundAccount: user?.boundAccount ?? null, boundNiche: user?.boundNiche ?? null });
}
