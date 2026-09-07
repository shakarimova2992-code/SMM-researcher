import { NextRequest, NextResponse } from "next/server";
import { consumeToken } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const origin = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const record = await consumeToken(token);
  if (!record) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  await createSession(record.email);
  return NextResponse.redirect(`${origin}/dashboard`);
}
