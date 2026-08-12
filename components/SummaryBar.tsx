"use client";

import { fmt, fmtHoursMinutes, fmtInt } from "../lib/calculations";
import { Stats } from "../lib/types";
import { panel } from "./ui";

interface StatProps {
  label: string;
  value: string;
  accent?: string;
}

function Stat({ label, value, accent }: StatProps) {
  return (
    <div className="flex flex-col">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9AA4B5]">{label}</div>
      <div className="text-[18px] font-bold tabular-nums leading-tight" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Badge({ label, met }: { label: string; met: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${
        met ? "text-[#0E8074] bg-[#E9F5F2]" : "text-[#C1442B] bg-[#FBEAE6]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${met ? "bg-[#0E8074]" : "bg-[#C1442B]"}`} />
      {label} {met ? "범위 안" : "범위 밖"}
    </div>
  );
}

interface SummaryBarProps {
  today: Stats;
  currentProjection: Stats;
  todayStatusMet: boolean;
  statusMet: boolean;
  remainingBudget: number;
  remainingHrs: number;
}

// 스크롤 없이 한눈에 보이는 핵심 요약 줄 (오늘 보기 전용) - 지금 실적 + 예상 최종 효율 + 남은 예산/시간
export default function SummaryBar({ today, currentProjection, todayStatusMet, statusMet, remainingBudget, remainingHrs }: SummaryBarProps) {
  const todayAccent = todayStatusMet ? "#0E8074" : "#C1442B";
  const projAccent = statusMet ? "#0E8074" : "#C1442B";

  return (
    <div className={`${panel} px-4 py-3 flex items-center gap-6 flex-wrap`}>
      <div className="flex items-center gap-4">
        <Stat label="지금 VTR" value={`${fmt(today.vtr)}%`} accent={todayAccent} />
        <Stat label="지금 CTR" value={`${fmt(today.ctr)}%`} accent={todayAccent} />
        <Badge label="오늘" met={todayStatusMet} />
      </div>

      <div className="w-px self-stretch bg-[#EEF0F4]" />

      <div className="flex items-center gap-4">
        <Stat label="예상 최종 VTR" value={`${fmt(currentProjection.vtr)}%`} accent={projAccent} />
        <Stat label="예상 최종 CTR" value={`${fmt(currentProjection.ctr)}%`} accent={projAccent} />
        <Badge label="예상" met={statusMet} />
      </div>

      <div className="w-px self-stretch bg-[#EEF0F4]" />

      <div className="flex items-center gap-4">
        <Stat label="남은 예산" value={`${fmtInt(remainingBudget)}원`} />
        <Stat label="남은 시간" value={fmtHoursMinutes(remainingHrs)} />
      </div>
    </div>
  );
}
