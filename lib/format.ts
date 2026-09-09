export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} млн`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")} тыс`;
  return String(n);
}

export function formatPercent(n: number): string {
  return Number.isFinite(n) ? `${n}%` : "—";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export function timeAgo(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} нед назад`;
  const months = Math.round(days / 30);
  return `${months} мес назад`;
}
