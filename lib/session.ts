import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "ns_session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "nichescope-dev-secret-change-me-in-production-32chars"
);
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 дней

export async function createSession(email: string) {
  const token = await new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(SECRET);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionEmail(): Promise<string | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload.email as string) ?? null;
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
