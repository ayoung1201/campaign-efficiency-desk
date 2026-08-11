"use client";

import { BarChart3 } from "lucide-react";
import { canonicalLine, fmt, fmtInt, inRange, LineEstimate, Range } from "../lib/calculations";
import { CANON_COLOR, CANON_COLOR_FALLBACK, CANONICAL_ORDER } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { panel } from "./ui";

const ACCENT = "#0D9488";

interface LineBreakdownCardProps {
  lineEstimates: LineEstimate[];
  vtrRange: Range;
  ctrRange: Range;
  isViewingToday?: boolean;
}

export default function LineBreakdownCard({ lineEstimates, vtrRange, ctrRange, isViewingToday = true }: LineBreakdownCardProps) {
  // 실제 라인명 그대로 보여주되(예: 데스크탑_2039 / 데스크탑_5059), 표준 카테고리 순서(데스크탑→모바일app→모바일web)로
  // 묶이도록 캐노니컬 값을 1차 정렬 기준으로 쓰고, 같은 카테고리 안에서는 이름순으로 정렬한다.
  const sorted = [...lineEstimates].sort((a, b) => {
    const ca = canonicalLine(a.line);
    const cb = canonicalLine(b.line);
    const ia = CANONICAL_ORDER.indexOf(ca);
    const ib = CANONICAL_ORDER.indexOf(cb);
    if (ia !== ib) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    return a.line.localeCompare(b.line, "ko");
  });

  return (
    <div className={`${panel} p-4 h-full flex flex-col`}>
      <SectionTitle icon={BarChart3} color={ACCENT}>
        {isViewingToday ? "라인별 오늘 실적" : "라인별 실적"}
      </SectionTitle>
      {/* 전체 요약(위)이 핵심이고 이건 보조 상세라서, 톤을 낮춰 작고 조용하게(색 배경 없이 텍스트만) 보여준다 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
        {sorted.map((le) => {
          const canon = canonicalLine(le.line);
          const color = CANON_COLOR[canon] ?? CANON_COLOR_FALLBACK;
          const vtrOk = inRange(le.vtr, vtrRange);
          const ctrOk = inRange(le.ctr, ctrRange);
          return (
            <div key={le.line} className="flex items-center justify-between gap-2 py-1.5 border-b border-[#F4F6F9] text-[12.5px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-medium text-[#334155] truncate">{le.line}</span>
                {le.line !== canon && <span className="text-[10.5px] text-[#9AA4B5] shrink-0">· {canon}</span>}
              </div>
              <div className="flex items-center gap-3 tabular-nums shrink-0">
                <span className="text-[#9AA4B5] text-[11px]">{fmtInt(le.spend)}원</span>
                <span className="font-semibold" style={{ color: vtrOk ? "#0E8074" : "#C1442B" }}>
                  {fmt(le.vtr)}%
                </span>
                <span className="font-semibold" style={{ color: ctrOk ? "#0E8074" : "#C1442B" }}>
                  {fmt(le.ctr)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
