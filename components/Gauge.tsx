"use client";

import { fmt } from "../lib/calculations";

interface GaugeProps {
  label: string;
  value: number;
  rangeMin: number;
  rangeMax: number;
  unit?: string;
}

// 진행 바(채워야 할 것 같은 느낌)를 없애고, 목표 범위 충족 여부를 색으로만 표시하는 단순 숫자 카드.
export default function Gauge({ label, value, rangeMin, rangeMax, unit = "%" }: GaugeProps) {
  const met = value >= rangeMin && value <= rangeMax;
  const accent = met ? "#0E8074" : "#C1442B";
  const accentBg = met ? "#EAF7F4" : "#FCEEEC";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-3" style={{ backgroundColor: accentBg }}>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: accent }}>
          {label}
        </div>
        <div className="text-[24px] font-bold tabular-nums leading-tight" style={{ color: accent }}>
          {fmt(value)}
          {unit}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10.5px] font-medium text-[#8792A6]">목표</div>
        <div className="text-[13px] font-semibold text-[#4A5568] tabular-nums">
          {fmt(rangeMin)}~{fmt(rangeMax)}
          {unit}
        </div>
      </div>
    </div>
  );
}
