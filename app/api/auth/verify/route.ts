import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken, createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const origin = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const email = await verifyMagicLinkToken(token);
  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  await createSession(email);
  return NextResponse.redirect(`${origin}/dashboard`);
}
