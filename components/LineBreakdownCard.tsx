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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {sorted.map((le) => {
          const canon = canonicalLine(le.line);
          const color = CANON_COLOR[canon] ?? CANON_COLOR_FALLBACK;
          const vtrOk = inRange(le.vtr, vtrRange);
          const ctrOk = inRange(le.ctr, ctrRange);
          return (
            <div key={le.line} className="rounded-lg border border-[#E1E5EC] overflow-hidden flex" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="flex-1 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-[13px] font-semibold text-[#1A2333] truncate">
                    {le.line}
                    {le.line !== canon && <span className="ml-1 text-[10.5px] font-normal text-[#9AA4B5]">· {canon}</span>}
                  </div>
                  <div className="text-[11px] text-[#9AA4B5] tabular-nums shrink-0">{fmtInt(le.spend)}원</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: vtrOk ? "#EAF7F4" : "#FCEEEC" }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: vtrOk ? "#0E8074" : "#C1442B" }}>
                      VTR
                    </div>
                    <div className="text-[16px] font-bold tabular-nums leading-tight" style={{ color: vtrOk ? "#0E8074" : "#C1442B" }}>
                      {fmt(le.vtr)}%
                    </div>
                  </div>
                  <div className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: ctrOk ? "#EAF7F4" : "#FCEEEC" }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: ctrOk ? "#0E8074" : "#C1442B" }}>
                      CTR
                    </div>
                    <div className="text-[16px] font-bold tabular-nums leading-tight" style={{ color: ctrOk ? "#0E8074" : "#C1442B" }}>
                      {fmt(le.ctr)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
