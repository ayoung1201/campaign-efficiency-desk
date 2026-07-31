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

export default function Gauge({ label, value, rangeMin, rangeMax, unit = "%", maxScale }: GaugeProps) {
  const max = maxScale ?? Math.max(rangeMax * 1.6, 1);
  const pct = Math.min(1, Math.max(0, value / max));
  const r = 68,
    cx = 90,
    cy = 90;

  const pt = (p: number): [number, number] => {
    const a = Math.PI * (1 - p);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const [vx, vy] = pt(pct);
  const met = value >= rangeMin && value <= rangeMax;

  const arcPath = (fromP: number, toP: number) => {
    const [x1, y1] = pt(fromP);
    const [x2, y2] = pt(toP);
    // 반원(180도) 안에서의 부분 호는 절대 180도를 넘지 않으므로 large-arc-flag는 항상 0
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  const trackColor = "#E4E8EF";
  const goodColor = "#0E8074";
  const riskColor = "#C1442B";
  const zoneColor = "#CFEBE5";

  const zoneFromP = Math.min(1, Math.max(0, rangeMin / max));
  const zoneToP = Math.min(1, Math.max(0, rangeMax / max));

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="180" height="112" viewBox="0 0 180 112">
        {/* 배경 트랙 */}
        <path d={arcPath(0, 1)} fill="none" stroke={trackColor} strokeWidth="14" strokeLinecap="round" />
        {/* 적정 범위 구간 표시 */}
        <path d={arcPath(zoneFromP, zoneToP)} fill="none" stroke={zoneColor} strokeWidth="14" />
        {/* 현재 값까지 진행 표시 (얇은 선) */}
        <path d={arcPath(0, pct)} fill="none" stroke={met ? goodColor : riskColor} strokeWidth="4" strokeLinecap="round" />
        {/* 현재 값 마커 (동그라미) */}
        <circle cx={vx} cy={vy} r="7" fill={met ? goodColor : riskColor} stroke="white" strokeWidth="2.5" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="'Pretendard Variable', ui-sans-serif, system-ui, sans-serif" fill="#101826">
          {fmt(value)}
          {unit}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontFamily="'Pretendard Variable', ui-sans-serif, system-ui, sans-serif" fill="#8792A6">
          목표 {fmt(rangeMin)}~{fmt(rangeMax)}
          {unit}
        </text>
      </svg>
      <div className="text-[12px] font-semibold uppercase tracking-wide text-[#8792A6]">{label}</div>
    </div>
  );
}
