"use client";

import { LayoutGrid } from "lucide-react";
import { canonicalLine, fmt, fmtInt, profileMetrics } from "../lib/calculations";
import { CANON_COLOR, CANON_COLOR_FALLBACK } from "../lib/constants";
import { LibraryProfile, MediaProfile } from "../lib/types";
import SectionTitle from "./SectionTitle";
import { panel, theadRow } from "./ui";

const ACCENT = "#2563EB";

export interface GroupedLine {
  key: string;
  canon: string;
  rows: MediaProfile[];
}

interface MediaDetailGridProps {
  groupedProfiles: GroupedLine[];
  libraryByKey: Map<string, LibraryProfile>;
  onToggleMedia: (latestRowId: string, nextIncluded: boolean) => void;
  bannedMedia: Set<string>;
}

export default function MediaDetailGrid({ groupedProfiles, libraryByKey, onToggleMedia, bannedMedia }: MediaDetailGridProps) {
  return (
    <div className={`${panel} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-[#E1E5EC]">
        <SectionTitle icon={LayoutGrid} color={ACCENT}>
          매체 상세
        </SectionTitle>
        <div className="text-[11.5px] text-[#8792A6] -mt-2">라인별로 나란히 표시 · 작은 회색 숫자는 매체별 평균 효율</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 p-4">
        {groupedProfiles.map((g) => (
          <div key={g.key} className="border border-[#E1E5EC] rounded-lg overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-[#EEF0F4] flex items-center justify-between gap-2">
              <div className="text-[12.5px] font-semibold text-[#334155] truncate flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CANON_COLOR[g.canon] ?? CANON_COLOR_FALLBACK }}
                />
                {g.key}
                {g.key !== g.canon && <span className="ml-0.5 text-[10.5px] font-normal text-[#9AA4B5]">· {g.canon}</span>}
              </div>
              <div className="text-[11px] text-[#9AA4B5] shrink-0">{g.rows.length}개</div>
            </div>
            <div className="overflow-y-auto max-h-[380px]">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-white">
                  <tr className={theadRow}>
                    <th className="w-7"></th>
                    <th className="text-left py-1.5 px-2.5 font-medium">매체</th>
                    <th className="text-right py-1.5 px-2.5 font-medium">VTR</th>
                    <th className="text-right py-1.5 px-2.5 font-medium">CTR</th>
                    <th className="text-right py-1.5 px-2.5 font-medium">소진액</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((p) => {
                    const { vtr, ctr } = profileMetrics(p);
                    const libKey = `${p.media}__${canonicalLine(p.line)}`;
                    const libMatch = libraryByKey.get(libKey);
                    const lib = libMatch ? profileMetrics(libMatch) : null;
                    const isBanned = bannedMedia.has(p.media);
                    return (
                      <tr
                        key={p.id}
                        className={`border-t border-[#EEF0F4] hover:bg-[#FAFBFC] ${p.included ? "" : "opacity-40"} ${isBanned ? "bg-[#FBEAE6]" : ""}`}
                      >
                        <td className="text-center py-1.5 px-2.5">
                          <input type="checkbox" checked={p.included} onChange={() => onToggleMedia(p.latestRowId, !p.included)} className="accent-[#0B1220]" />
                        </td>
                        <td className="py-1.5 px-2.5 font-medium">
                          {p.media}
                          {isBanned && (
                            <span className="ml-1.5 text-[10px] font-semibold text-[#C1442B] bg-white border border-[#E7C9C2] px-1 py-0.5 rounded align-middle">
                              노출 불가
                            </span>
                          )}
                        </td>
                        <td className="text-right py-1.5 px-2.5">
                          <div className="tabular-nums font-semibold">{p.imps ? `${fmt(vtr)}%` : "-"}</div>
                          {lib && <div className="tabular-nums text-[10.5px] text-[#9AA4B5]">평균 {fmt(lib.vtr)}%</div>}
                        </td>
                        <td className="text-right py-1.5 px-2.5">
                          <div className="tabular-nums font-semibold">{p.imps ? `${fmt(ctr)}%` : "-"}</div>
                          {lib && <div className="tabular-nums text-[10.5px] text-[#9AA4B5]">평균 {fmt(lib.ctr)}%</div>}
                        </td>
                        <td className="text-right py-1.5 px-2.5 tabular-nums">{fmtInt(p.spend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
