"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Report } from "@/lib/mock/types";
import { formatCompact } from "@/lib/format";

const PIE_COLORS = ["#8226ff", "#ff3d7f", "#ffb703"];

export function GrowthChart({ data }: { data: Report["growth"] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-xl bg-black/15 text-center">
        <span className="text-2xl">📈</span>
        <p className="max-w-[220px] text-xs text-white/40">
          История роста подписчиков недоступна — ни один открытый источник не отдаёт её для чужих аккаунтов.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="growthLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8226ff" />
            <stop offset="100%" stopColor="#ff3d7f" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="month" stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="rgba(255,255,255,0.25)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={54}
          tickFormatter={(v) => formatCompact(Number(v))}
        />
        <Tooltip
          contentStyle={{ background: "#1f0f37", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "white" }}
          formatter={(v: number) => [formatCompact(v), "Подписчики"]}
        />
        <Line type="monotone" dataKey="followers" stroke="url(#growthLine)" strokeWidth={3} dot={{ r: 3, fill: "#ff3d7f" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FormatMixChart({ data }: { data: Report["formatMix"] }) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={40} outerRadius={65} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-white/70">{d.label}</span>
            <span className="font-display font-bold">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Heatmap({ data }: { data: Report["heatmap"] }) {
  const days = Array.from(new Set(data.map((d) => d.day)));
  const hours = Array.from(new Set(data.map((d) => d.hour)));
  const get = (day: string, hour: number) => data.find((d) => d.day === day && d.hour === hour)?.value ?? 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-1">
        <thead>
          <tr>
            <th></th>
            {hours.map((h) => (
              <th key={h} className="text-[10px] font-normal text-white/40">
                {h}:00
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td className="pr-2 text-xs text-white/50">{day}</td>
              {hours.map((h) => {
                const v = get(day, h);
                return (
                  <td key={h}>
                    <div
                      className="h-7 w-full rounded-md"
                      style={{ background: `rgba(255, 61, 127, ${0.12 + v * 0.75})` }}
                      title={`${day} ${h}:00 — активность ${(v * 100).toFixed(0)}%`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
