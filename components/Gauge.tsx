"use client";

import { fmt } from "../lib/calculations";

interface GaugeProps {
  label: string;
  value: number;
  rangeMin: number;
  rangeMax: number;
  unit?: string;
  maxScale?: number;
}

// 목표 구간(밴드) 대비 실측치를 보여주는 가로형 불릿 바.
// 반원 다이얼+바늘 방식보다 한 줄로 조밀하게 배치할 수 있고, 목표 구간과 실측치를 한눈에 비교하기 쉽다.
export default function Gauge({ label, value, rangeMin, rangeMax, unit = "%", maxScale }: GaugeProps) {
  const max = maxScale ?? Math.max(rangeMax * 1.6, 1);
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));
  const met = value >= rangeMin && value <= rangeMax;
  const accent = met ? "#0E8074" : "#C1442B";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8792A6]">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[19px] font-bold tabular-nums" style={{ color: accent }}>
            {fmt(value)}
            {unit}
          </span>
          <span className="text-[11px] text-[#9AA4B5] tabular-nums">
            목표 {fmt(rangeMin)}~{fmt(rangeMax)}
            {unit}
          </span>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full bg-[#EEF0F4] overflow-hidden">
        <div
          className="absolute inset-y-0 bg-[#CFEBE5]"
          style={{ left: `${pct(rangeMin)}%`, width: `${Math.max(0, pct(rangeMax) - pct(rangeMin))}%` }}
        />
        <div className="absolute inset-y-0 w-px bg-[#101826]/15" style={{ left: `${pct(rangeMin)}%` }} />
        <div className="absolute inset-y-0 w-px bg-[#101826]/15" style={{ left: `${pct(rangeMax)}%` }} />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct(value)}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
