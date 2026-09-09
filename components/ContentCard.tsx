import { Badge, Card } from "@/components/ui";
import { formatCompact, formatPercent, timeAgo } from "@/lib/format";
import type { ContentItem } from "@/lib/mock/types";

export default function ContentCard({ item, rank }: { item: ContentItem; rank: number }) {
  const hasSaves = Number.isFinite(item.saves);

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <div
        className="relative flex h-36 items-end p-4"
        style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}
      >
        <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold text-white">
          #{rank}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-white">
          {item.type === "reel" ? "🎬 Reels" : item.format}
        </span>
        <span className="text-4xl drop-shadow">{item.emoji}</span>
        <a
          href={item.permalink}
          target="_blank"
          rel="noopener noreferrer"
          title="Открыть в Instagram"
          className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/65"
        >
          ↗
        </a>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-semibold text-white/90">{item.caption}</p>
        <Badge tone="gold" className="mt-2 w-fit">{item.hook}</Badge>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {item.type === "reel" && (
            <Metric label="Просмотры" value={formatCompact(item.views ?? 0)} />
          )}
          <Metric label="Лайки" value={formatCompact(item.likes)} />
          <Metric label="Комментарии" value={formatCompact(item.comments)} />
          {hasSaves && <Metric label="Сохранения" value={formatCompact(item.saves)} />}
        </div>
        <a
          href={item.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/75 transition hover:border-violet-400 hover:text-white"
        >
          Открыть {item.type === "reel" ? "Reels" : "пост"} в Instagram ↗
        </a>
        <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
          <span>{timeAgo(item.postedAt)}</span>
          <span className="font-semibold text-mint-400">ER {formatPercent(item.engagementRate)}</span>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 px-2.5 py-1.5">
      <div className="font-display text-sm font-bold">{value}</div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  );
}
