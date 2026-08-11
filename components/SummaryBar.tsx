"use client";

import { fmt, fmtHoursMinutes, fmtInt } from "../lib/calculations";
import { Stats } from "../lib/types";
import { panel } from "./ui";

interface StatProps {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}

function Stat({ label, value, accent, sub }: StatProps) {
  return (
    <div className="flex flex-col">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9AA4B5]">{label}</div>
      <div className="text-[18px] font-bold tabular-nums leading-tight" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-[#9AA4B5] tabular-nums leading-tight mt-0.5">{sub}</div>}
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

interface Range {
  min: number;
  max: number;
}

interface SummaryBarProps {
  today: Stats;
  currentProjection: Stats;
  todayStatusMet: boolean;
  statusMet: boolean;
  remainingBudget: number;
  remainingHrs: number;
  isViewingToday: boolean;
  vtrRange?: Range; // 과거 날짜 조회 시 목표 범위 표기용 (오늘 보기에서는 사이드바에 이미 있어 생략)
  ctrRange?: Range;
  asOfLabel?: string | null; // 과거 날짜 조회 시 몇 시까지 업로드된 데이터인지
}

// 스크롤 없이 한눈에 보이는 핵심 요약 줄. 오늘을 보는 중이면 지금 실적 + 예상 최종 효율 + 남은 예산/시간을,
// 지난 날짜를 조회 중이면 "예상/남은"은 의미가 없으므로 그날 최종 실적 + 목표 범위 + 업로드 시각만 보여준다.
export default function SummaryBar({
  today,
  currentProjection,
  todayStatusMet,
  statusMet,
  remainingBudget,
  remainingHrs,
  isViewingToday,
  vtrRange,
  ctrRange,
  asOfLabel,
}: SummaryBarProps) {
  const todayAccent = todayStatusMet ? "#0E8074" : "#C1442B";
  const projAccent = statusMet ? "#0E8074" : "#C1442B";

  if (!isViewingToday) {
    return (
      <div className={`${panel} px-4 py-3 flex items-center gap-6 flex-wrap`}>
        <div className="flex items-center gap-4">
          <Stat label="VTR" value={`${fmt(today.vtr)}%`} accent={todayAccent} sub={vtrRange ? `목표 ${fmt(vtrRange.min)}~${fmt(vtrRange.max)}%` : undefined} />
          <Stat label="CTR" value={`${fmt(today.ctr)}%`} accent={todayAccent} sub={ctrRange ? `목표 ${fmt(ctrRange.min)}~${fmt(ctrRange.max)}%` : undefined} />
          <Badge label="해당 날짜" met={todayStatusMet} />
        </div>
        <div className="w-px self-stretch bg-[#EEF0F4]" />
        <div className="flex items-center gap-4">
          <Stat label="Imps." value={fmtInt(today.imps)} />
          <Stat label="소진액" value={`${fmtInt(today.spend)}원`} />
        </div>
        {asOfLabel && (
          <>
            <div className="w-px self-stretch bg-[#EEF0F4]" />
            <div className="text-[11.5px] text-[#9AA4B5]">{asOfLabel} 업로드분 기준</div>
          </>
        )}
      </div>
    );
  }

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
