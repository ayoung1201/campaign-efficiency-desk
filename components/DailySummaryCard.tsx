"use client";

import { Activity } from "lucide-react";
import { fmtInt, LineEstimate, Range } from "../lib/calculations";
import { Stats } from "../lib/types";
import Gauge from "./Gauge";
import { LineChips } from "./LineBreakdownCard";
import SectionTitle from "./SectionTitle";
import { label, panel } from "./ui";

const ACCENT = "#4F46E5";

interface DailySummaryCardProps {
  today: Stats;
  vtrRange: Range;
  ctrRange: Range;
  dateLabel: string;
  asOfLabel?: string | null;
  lineEstimates: LineEstimate[];
}

// 과거 날짜 조회 시 "그날 전체 효율"과 "라인별 실적"을 카드 하나로 묶어서 보여준다. 예전엔 요약 줄과
// 라인별 카드가 따로 떨어져 있어 붕 뜬 느낌이었는데, 하나의 카드 안에 상단(전체)-하단(라인별) 위계로 정리했다.
export default function DailySummaryCard({ today, vtrRange, ctrRange, dateLabel, asOfLabel, lineEstimates }: DailySummaryCardProps) {
  return (
    <div className={`${panel} p-5`}>
      <SectionTitle icon={Activity} color={ACCENT}>
        {dateLabel} 효율
      </SectionTitle>

      {/* 게이지와 부가 지표(Imps./소진액/업로드)를 한 덩어리로 묶어서, 전체 효율에 관한 정보가
          한눈에 같이 읽히게 한다 (따로 떨어진 구석에 붕 떠 보이지 않도록). */}
      <div className="flex items-stretch flex-wrap gap-4 mt-3 mb-5">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <Gauge label="VTR" value={today.vtr} rangeMin={vtrRange.min} rangeMax={vtrRange.max} />
          <Gauge label="CTR" value={today.ctr} rangeMin={ctrRange.min} rangeMax={ctrRange.max} />
        </div>
        <div className="w-px bg-[#EEF0F4]" />
        <div className="flex items-center gap-5">
          <div>
            <div className={label}>Imps.</div>
            <div className="font-bold text-[16px] tabular-nums">{fmtInt(today.imps)}</div>
          </div>
          <div>
            <div className={label}>소진액</div>
            <div className="font-bold text-[16px] tabular-nums">{fmtInt(today.spend)}원</div>
          </div>
          {asOfLabel && (
            <div>
              <div className={label}>업로드</div>
              <div className="text-[13px] font-semibold text-[#4A5568] whitespace-nowrap">{asOfLabel}</div>
            </div>
          )}
        </div>
      </div>

      {lineEstimates.length > 1 && (
        <div className="pt-4 border-t border-[#EEF0F4]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA4B5] mb-2">라인별 실적</div>
          <LineChips lineEstimates={lineEstimates} vtrRange={vtrRange} ctrRange={ctrRange} />
        </div>
      )}
    </div>
  );
}
