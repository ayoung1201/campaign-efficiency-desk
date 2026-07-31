"use client";

import { BarChart3 } from "lucide-react";
import { fmt, fmtInt, inRange, LineEstimate, Range } from "../lib/calculations";
import { CANON_COLOR, CANON_COLOR_FALLBACK, CANONICAL_ORDER } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { panel, theadRow } from "./ui";

const ACCENT = "#0D9488";

interface LineBreakdownCardProps {
  lineEstimates: LineEstimate[];
  vtrRange: Range;
  ctrRange: Range;
}

export default function LineBreakdownCard({ lineEstimates, vtrRange, ctrRange }: LineBreakdownCardProps) {
  const sorted = [...lineEstimates].sort((a, b) => {
    const ia = CANONICAL_ORDER.indexOf(a.line);
    const ib = CANONICAL_ORDER.indexOf(b.line);
    if (ia === -1 && ib === -1) return a.line.localeCompare(b.line);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className={`${panel} p-4`}>
      <SectionTitle icon={BarChart3} color={ACCENT}>
        라인별 오늘 실적
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
            {sorted.map((le) => (
              <tr key={le.line} className="border-t border-[#EEF0F4] hover:bg-[#FAFBFC]">
                <td className="py-2 px-3 font-medium">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: CANON_COLOR[le.line] ?? CANON_COLOR_FALLBACK }}
                  />
                  {le.line}
                </td>
                <td className="text-right py-2 px-3 tabular-nums">{fmtInt(le.spend)}원</td>
                <td className={`text-right py-2 px-3 tabular-nums font-semibold ${inRange(le.vtr, vtrRange) ? "text-[#0E8074]" : "text-[#C1442B]"}`}>{fmt(le.vtr)}%</td>
                <td className={`text-right py-2 px-3 tabular-nums font-semibold ${inRange(le.ctr, ctrRange) ? "text-[#0E8074]" : "text-[#C1442B]"}`}>{fmt(le.ctr)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
