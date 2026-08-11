"use client";

import { RefObject } from "react";
import { CheckCircle2, Database, Upload } from "lucide-react";
import { fmt, profileMetrics } from "../lib/calculations";
import { LibraryProfile } from "../lib/types";
import { LIBRARY_LINE_OPTIONS } from "../lib/constants";
import SectionTitle from "./SectionTitle";
import { btn, input, panel, theadRow } from "./ui";

const ACCENT = "#0891B2";

export interface LibrarySourceGroup {
  source: string;
  lines: string[];
  mediaCount: number;
}

interface LibraryPanelProps {
  librarySourceGroups: LibrarySourceGroup[];
  libraryLineSuggestions: string[];
  libraryProfiles: LibraryProfile[];
  libViewLine: string;
  setLibViewLine: (l: string) => void;
  libCampaignName: string;
  setLibCampaignName: (v: string) => void;
  libUploadLine: string;
  setLibUploadLine: (l: string) => void;
  libUploadSuccess: { source: string; line: string; mediaCount: number } | null;
  error: string;
  libraryFileRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LibraryPanel({
  librarySourceGroups,
  libraryLineSuggestions,
  libraryProfiles,
  libViewLine,
  setLibViewLine,
  libCampaignName,
  setLibCampaignName,
  libUploadLine,
  setLibUploadLine,
  libUploadSuccess,
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
        이미 종료된 캠페인의 매체 리포트를 라인별로 업로드하면 매체명·Imp·View·Click·소진광고비를 자동으로 읽어서 쌓아요. 리포트 파일 자체엔 라인 구분이 없어서, 업로드할 때 캠페인명과 라인을 직접 지정해주세요. 캠페인 하나에 라인이 여러 개면(예: 데스크탑_2039, 데스크탑_5059) 라인명을 다르게 해서 파일을 따로따로 업로드해야 둘 다 쌓여요 — 같은 캠페인명이라도 라인명이 다르면 서로 덮어쓰지 않습니다. 정확히 같은 캠페인명+라인명을 다시 올릴 때만 그 조합만 덮어써요.
      </div>

      {librarySourceGroups.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          <span className="text-[11px] font-semibold text-[#8792A6]">포함된 캠페인 ({librarySourceGroups.length}건) · 라인별 업로드 현황</span>
          <div className="flex flex-wrap gap-1.5">
            {librarySourceGroups.map((g) => (
              <div key={g.source} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-[#F4F6F9] border border-[#E1E5EC]">
                <span className="text-[11.5px] font-semibold text-[#334155]">{g.source}</span>
                <span className="text-[10px] text-[#9AA4B5]">{g.mediaCount}건</span>
                <div className="flex flex-wrap gap-1">
                  {g.lines.map((l) => (
                    <span key={l} className="text-[10.5px] px-1.5 py-0.5 rounded bg-white border border-[#E1E5EC] text-[#4A5568]">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap mb-2">
        <input
          type="text"
          value={libCampaignName}
          onChange={(e) => setLibCampaignName(e.target.value)}
          placeholder="캠페인명 입력"
          className={`${input} w-44`}
        />
        <input
          type="text"
          list="lib-line-suggestions"
          value={libUploadLine}
          onChange={(e) => setLibUploadLine(e.target.value)}
          placeholder="라인명 (예: 데스크탑_2039)"
          className={`${input} w-44`}
        />
        <datalist id="lib-line-suggestions">
          {libraryLineSuggestions.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <button onClick={() => libraryFileRef.current?.click()} className={btn}>
          <Upload size={14} /> 종료 캠페인 리포트 업로드
        </button>
        <input ref={libraryFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} className="hidden" />
      </div>

      {libUploadSuccess && (
        <div className="flex items-center gap-1.5 text-[12.5px] text-[#0E8074] bg-[#E9F5F2] border border-[#BFE3DB] rounded-md px-3 py-2 mb-3">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>
            <b>{libUploadSuccess.source}</b> · <b>{libUploadSuccess.line}</b> 라인 업로드 완료 (매체 {libUploadSuccess.mediaCount}건 저장됨)
          </span>
        </div>
      )}
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
                  <th className="text-right py-2.5 px-3 font-medium">캠페인 수</th>
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
