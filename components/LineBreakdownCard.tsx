"use client";

import { BarChart3 } from "lucide-react";
import { canonicalLine, fmt, fmtInt, inRange, LineEstimate, Range } from "../lib/calculations";
import { CANON_COLOR, CANON_COLOR_FALLBACK, CANONICAL_ORDER } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { panel } from "./ui";

const ACCENT = "#0D9488";

// 라인별 실적을 표준 카테고리(데스크탑/모바일app/모바일web)별로 열을 나눠서 보여준다 - 같은 카테고리의
// 서로 다른 라인(예: 데스크탑_2039, 데스크탑_5059)이 같은 열에 세로로 묶이도록. 다른 카드에서도 재사용한다.
export function LineChips({ lineEstimates, vtrRange, ctrRange }: { lineEstimates: LineEstimate[]; vtrRange: Range; ctrRange: Range }) {
  const groups = new Map<string, LineEstimate[]>();
  for (const le of lineEstimates) {
    const canon = canonicalLine(le.line);
    if (!groups.has(canon)) groups.set(canon, []);
    groups.get(canon)!.push(le);
  }
  const orderedCanons = [...groups.keys()].sort((a, b) => {
    const ia = CANONICAL_ORDER.indexOf(a);
    const ib = CANONICAL_ORDER.indexOf(b);
    if (ia !== ib) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    return a.localeCompare(b, "ko");
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1.5">
      {orderedCanons.map((canon) => {
        const color = CANON_COLOR[canon] ?? CANON_COLOR_FALLBACK;
        const items = [...groups.get(canon)!].sort((a, b) => a.line.localeCompare(b.line, "ko"));
        return (
          <div key={canon} className="flex flex-col gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full ml-0.5" style={{ backgroundColor: color }} />
            {items.map((le) => {
              const vtrOk = inRange(le.vtr, vtrRange);
              const ctrOk = inRange(le.ctr, ctrRange);
              return (
                <div
                  key={le.line}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-[#E1E5EC] bg-[#FAFBFC] text-[12px]"
                >
                  <span className="font-medium text-[#334155] truncate">{le.line}</span>
                  <div className="flex items-center gap-2 tabular-nums shrink-0">
                    <span className="text-[#9AA4B5]">{fmtInt(le.spend)}원</span>
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
        );
      })}
    </div>
  );
}

interface LineBreakdownCardProps {
  lineEstimates: LineEstimate[];
  vtrRange: Range;
  ctrRange: Range;
}

export default function LineBreakdownCard({ lineEstimates, vtrRange, ctrRange }: LineBreakdownCardProps) {
  return (
    <div className={`${panel} p-4 h-full flex flex-col`}>
      <SectionTitle icon={BarChart3} color={ACCENT}>
        라인별 오늘 실적
      </SectionTitle>
      <LineChips lineEstimates={lineEstimates} vtrRange={vtrRange} ctrRange={ctrRange} />
    </div>
  );
}
