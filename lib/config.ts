// Email-адреса без ограничения "1 аккаунт на ссылку" — обычно для тестирования
// самим владельцем продукта. Задаётся через переменную окружения UNLIMITED_EMAILS
// (через запятую), с дефолтом ниже на случай, если переменная не задана.
// В проде лучше держать список только в переменной окружения (см. .env.example),
// а не в коде, если репозиторий публичный.
const DEFAULT_UNLIMITED_EMAILS = ["shakarimova2992@gmail.com"];

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const fromEnv = parseList(process.env.UNLIMITED_EMAILS);
export const UNLIMITED_EMAILS = new Set<string>(fromEnv.length > 0 ? fromEnv : DEFAULT_UNLIMITED_EMAILS);

export function isUnlimitedEmail(email: string): boolean {
  return UNLIMITED_EMAILS.has(email.trim().toLowerCase());
}
