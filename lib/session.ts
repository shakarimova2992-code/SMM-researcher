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

// Magic-link токен для входа по email. Раньше это была случайная строка,
// которую сохраняли в файловую БД (data/db.json) и потом искали там же.
// На serverless (Vercel) запрос ссылки и переход по ней почти всегда
// попадают на РАЗНЫЕ инстансы функции с разной временной файловой системой —
// поэтому токен, записанный при запросе, не находился при переходе по
// ссылке ("Ссылка устарела или уже использована" сразу после получения).
// Теперь токен — это подписанный JWT с email внутри: проверяется по
// электронной подписи, без обращения к файлу, и работает одинаково
// на любом количестве serverless-инстансов.
const MAGIC_LINK_TTL_SECONDS = 15 * 60; // 15 минут

export async function createMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email: email.toLowerCase(), purpose: "magic-link" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_TTL_SECONDS}s`)
    .sign(SECRET);
}

export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== "magic-link" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}
