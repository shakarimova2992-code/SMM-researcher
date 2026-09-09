import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isLiveDataEnabled } from "@/lib/live/apify";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Требуется вход" }, { status: 401 });
  }

  const raw = process.env.APIFY_API_TOKEN;

  return NextResponse.json({
    ok: true,
    apifyTokenPresent: Boolean(raw),
    apifyTokenLength: raw?.length ?? 0,
    apifyTokenLooksValid: Boolean(raw && raw.startsWith("apify_api_")),
    isLiveDataEnabled: isLiveDataEnabled(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    deployedAt: new Date().toISOString(),
  });
}
