import { Badge, Card } from "@/components/ui";
import { formatCompact, timeAgo } from "@/lib/format";
import type { ContentItem } from "@/lib/mock/types";

export default function ContentCard({ item, rank }: { item: ContentItem; rank: number }) {
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
          <Metric label="Сохранения" value={formatCompact(item.saves)} />
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-white/40">
          <span>{timeAgo(item.postedAt)}</span>
          <span className="font-semibold text-mint-400">ER {item.engagementRate}%</span>
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
