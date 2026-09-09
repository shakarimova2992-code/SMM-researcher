// Тонкий клиент над Apify Instagram-акторами.
//
// ВАЖНО: код написан по официальной документации Apify (apify.com/apify/instagram-scraper,
// apify.com/apify/instagram-profile-scraper), но ни разу не проверен на реальном ответе —
// облачная песочница, в которой это писалось, не имеет доступа к api.apify.com (сетевая
// политика окружения). Поэтому маппинг полей в lib/live/liveEngine.ts сделан защитно
// (несколько альтернативных имён полей на каждый показатель) и никогда не роняет сайт —
// при любой ошибке или неожиданном формате ответа вызывающий код просто получает null/[]
// и откатывается на мок-данные с явным предупреждением в интерфейсе.
//
// Если после реального теста окажется, что имена полей отличаются — правьте только
// функции map* в liveEngine.ts, сам клиент трогать не нужно.

const APIFY_BASE = "https://api.apify.com/v2/actors";
const DEFAULT_TIMEOUT_MS = 60_000;

export class ApifyError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ApifyError";
  }
}

function getToken(): string | null {
  return process.env.APIFY_API_TOKEN?.trim() || null;
}

export function isLiveDataEnabled(): boolean {
  return Boolean(getToken());
}

/**
 * Запускает актор синхронно и возвращает элементы датасета.
 * actorId в формате "owner~actor-name" (так требует Apify REST API).
 */
export async function runApifyActor<T = unknown>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const token = getToken();
  if (!token) throw new ApifyError("APIFY_API_TOKEN не задан");

  const url = `${APIFY_BASE}/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApifyError(`Apify вернул ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new ApifyError("Apify вернул неожиданный формат ответа (ожидался массив)");
    }
    return data as T[];
  } catch (err) {
    if (err instanceof ApifyError) throw err;
    throw new ApifyError("Ошибка запроса к Apify", err);
  } finally {
    clearTimeout(timeout);
  }
}
