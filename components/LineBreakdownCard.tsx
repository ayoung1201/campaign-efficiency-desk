"use client";

import { BarChart3 } from "lucide-react";
import { canonicalLine, fmt, fmtInt, inRange, LineEstimate, Range } from "../lib/calculations";
import { CANON_COLOR, CANON_COLOR_FALLBACK, CANONICAL_ORDER } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { panel } from "./ui";

const ACCENT = "#0D9488";

// 라인별 실적을 테두리 있는 칩으로 나열. 내용물 길이에 맞는 칩으로 두고 늘려 펼치지 않아서
// (justify-between 대신 flex-wrap) 여백이 길게 늘어지지 않는다. 다른 카드에서도 재사용한다.
export function LineChips({ lineEstimates, vtrRange, ctrRange }: { lineEstimates: LineEstimate[]; vtrRange: Range; ctrRange: Range }) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {sorted.map((le) => {
        const canon = canonicalLine(le.line);
        const color = CANON_COLOR[canon] ?? CANON_COLOR_FALLBACK;
        const vtrOk = inRange(le.vtr, vtrRange);
        const ctrOk = inRange(le.ctr, ctrRange);
        return (
          <div
            key={le.line}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#E1E5EC] bg-[#FAFBFC] text-[12px] w-fit max-w-full"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="font-medium text-[#334155] whitespace-nowrap">{le.line}</span>
            {le.line !== canon && <span className="text-[10.5px] text-[#9AA4B5] whitespace-nowrap">· {canon}</span>}
            <span className="w-px h-3 bg-[#E1E5EC] shrink-0" />
            <span className="text-[#9AA4B5] tabular-nums whitespace-nowrap">{fmtInt(le.spend)}원</span>
            <span className="font-semibold tabular-nums whitespace-nowrap" style={{ color: vtrOk ? "#0E8074" : "#C1442B" }}>
              {fmt(le.vtr)}%
            </span>
            <span className="font-semibold tabular-nums whitespace-nowrap" style={{ color: ctrOk ? "#0E8074" : "#C1442B" }}>
              {fmt(le.ctr)}%
            </span>
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
