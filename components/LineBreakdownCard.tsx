"use client";

import { BarChart3 } from "lucide-react";
import { canonicalLine, fmt, fmtInt, inRange, LineEstimate, Range } from "../lib/calculations";
import { CANON_COLOR, CANON_COLOR_FALLBACK, CANONICAL_ORDER } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { panel, theadRow } from "./ui";

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
      <div className="overflow-x-auto rounded-lg border border-[#EEF0F4]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className={theadRow}>
              <th className="text-left py-2 px-3 font-medium">라인</th>
              <th className="text-right py-2 px-3 font-medium">소진액</th>
              <th className="text-right py-2 px-3 font-medium">VTR</th>
              <th className="text-right py-2 px-3 font-medium">CTR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((le) => {
              const canon = canonicalLine(le.line);
              return (
                <tr key={le.line} className="border-t border-[#EEF0F4] hover:bg-[#FAFBFC]">
                  <td className="py-2 px-3 font-medium">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: CANON_COLOR[canon] ?? CANON_COLOR_FALLBACK }}
                    />
                    {le.line}
                    {le.line !== canon && <span className="ml-1 text-[10.5px] font-normal text-[#9AA4B5]">· {canon}</span>}
                  </td>
                  <td className="text-right py-2 px-3 tabular-nums">{fmtInt(le.spend)}원</td>
                  <td className={`text-right py-2 px-3 tabular-nums font-semibold ${inRange(le.vtr, vtrRange) ? "text-[#0E8074]" : "text-[#C1442B]"}`}>{fmt(le.vtr)}%</td>
                  <td className={`text-right py-2 px-3 tabular-nums font-semibold ${inRange(le.ctr, ctrRange) ? "text-[#0E8074]" : "text-[#C1442B]"}`}>{fmt(le.ctr)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
