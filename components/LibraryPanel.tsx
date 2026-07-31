"use client";

import { RefObject } from "react";
import { Database, Upload } from "lucide-react";
import { fmt, profileMetrics } from "../lib/calculations";
import { LibraryProfile } from "../lib/types";
import { LIBRARY_LINE_OPTIONS } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { btn, panel, theadRow } from "./ui";

const ACCENT = "#0891B2";

interface LibraryPanelProps {
  librarySources: string[];
  libraryProfiles: LibraryProfile[];
  libViewLine: string;
  setLibViewLine: (l: string) => void;
  error: string;
  libraryFileRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LibraryPanel({
  librarySources,
  libraryProfiles,
  libViewLine,
  setLibViewLine,
  error,
  libraryFileRef,
  onUpload,
}: LibraryPanelProps) {
  return (
    <div className={`${panel} p-5`}>
      <SectionTitle icon={Database} color={ACCENT}>
        매체별 평균 효율
      </SectionTitle>
      <div className="text-[12px] text-[#8792A6] -mt-2 mb-4">
        일별 매체 리포트를 업로드하면 매체명·채널·Imp·View·Click·소진광고비를 자동으로 읽어서 쌓아요. 같은 날짜를 다시 올리면 그 날짜만 덮어쓰고, 다른 날짜는 계속 쌓여서 여러 날 평균이 됩니다.
      </div>

      {librarySources.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mb-4">
          <span className="text-[11px] font-semibold text-[#8792A6] mr-1">포함된 날짜 ({librarySources.length}일치)</span>
          {librarySources.map((s) => (
            <span key={s} className="text-[11.5px] px-2 py-0.5 rounded-full bg-[#F4F6F9] border border-[#E1E5EC] text-[#4A5568]">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap mb-5">
        <button onClick={() => libraryFileRef.current?.click()} className={btn}>
          <Upload size={14} /> 일별 리포트 업로드
        </button>
        <input ref={libraryFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} className="hidden" />
      </div>
      {error && <div className="text-[#C1442B] text-[13px] mb-3">{error}</div>}
      {libraryProfiles.length === 0 ? (
        <div className="text-[13px] text-[#8792A6]">아직 쌓인 라이브러리 데이터가 없어요.</div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-3 border-b border-[#E1E5EC]">
            {[...LIBRARY_LINE_OPTIONS, "전체"].map((l) => (
              <button
                key={l}
                onClick={() => setLibViewLine(l)}
                className={`px-3 py-2 text-[12.5px] font-medium -mb-px border-b-2 transition-colors ${
                  libViewLine === l ? "border-[#0B1220] text-[#0B1220]" : "border-transparent text-[#8792A6] hover:text-[#0B1220]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#EEF0F4]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className={theadRow}>
                  <th className="text-left py-2.5 px-3 font-medium">매체</th>
                  {libViewLine === "전체" && <th className="text-left py-2.5 px-3 font-medium">라인</th>}
                  <th className="text-right py-2.5 px-3 font-medium">일수</th>
                  <th className="text-right py-2.5 px-3 font-medium">평균 VTR</th>
                  <th className="text-right py-2.5 px-3 font-medium">평균 CTR</th>
                </tr>
              </thead>
              <tbody>
                {[...libraryProfiles]
                  .filter((l) => libViewLine === "전체" || (l.line === libViewLine && l.imps > 0))
                  .sort((a, b) => profileMetrics(b).vtr - profileMetrics(a).vtr)
                  .map((l) => {
                    const { vtr, ctr } = profileMetrics(l);
                    return (
                      <tr key={l.id} className="border-t border-[#EEF0F4] hover:bg-[#FAFBFC]">
                        <td className="py-2.5 px-3 font-medium">{l.media}</td>
                        {libViewLine === "전체" && <td className="py-2.5 px-3 text-[#64748B]">{l.line}</td>}
                        <td className="text-right py-2.5 px-3 tabular-nums">{l.campaignCount}</td>
                        <td className="text-right py-2.5 px-3 tabular-nums font-semibold">{fmt(vtr)}%</td>
                        <td className="text-right py-2.5 px-3 tabular-nums font-semibold">{fmt(ctr)}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
