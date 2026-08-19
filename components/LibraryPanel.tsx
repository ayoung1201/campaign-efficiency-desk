"use client";

import { RefObject, useState } from "react";
import { CheckCircle2, Database, Files, Trash2, Upload } from "lucide-react";
import { fmt, profileMetrics } from "../lib/calculations";
import { LibraryProfile } from "../lib/types";
import { LIBRARY_LINE_OPTIONS } from "../lib/constants";
import BatchUploadModal from "./BatchUploadModal";
import FileDropZone from "./FileDropZone";
import SectionTitle from "./SectionTitle";
import { btn, input, panel } from "./ui";

const ACCENT = "#0891B2";
const CUSTOM = "__custom__";

export interface LibrarySourceGroup {
  source: string;
  lines: string[];
  mediaCount: number;
}

interface LibraryPanelProps {
  librarySourceGroups: LibrarySourceGroup[];
  libraryLineSuggestions: string[];
  libLineOptionsForCampaign: string[];
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
  onDeleteSource: (source: string) => void;
  libBatchFileRef: RefObject<HTMLInputElement | null>;
  onLibBatchFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  libBatchFiles: File[] | null;
  libBatchAssignments: string[];
  onChangeLibBatchAssignment: (index: number, line: string) => void;
  onConfirmLibBatchUpload: () => void;
  onCancelLibBatchUpload: () => void;
  onFilesDropped: (files: File[]) => void;
}

export default function LibraryPanel({
  librarySourceGroups,
  libraryLineSuggestions,
  libLineOptionsForCampaign,
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
  onDeleteSource,
  libBatchFileRef,
  onLibBatchFilesSelected,
  libBatchFiles,
  libBatchAssignments,
  onChangeLibBatchAssignment,
  onConfirmLibBatchUpload,
  onCancelLibBatchUpload,
  onFilesDropped,
}: LibraryPanelProps) {
  // 목록에 없는 새 라인명을 직접 입력하고 싶을 때만 텍스트 입력으로 전환한다
  const [customLineMode, setCustomLineMode] = useState(false);

  return (
    <div className={`${panel} p-5`}>
      <SectionTitle icon={Database} color={ACCENT}>
        매체별 평균 효율
      </SectionTitle>
      <div className="text-[12px] text-[#8792A6] -mt-2 mb-4">종료된 캠페인의 매체 리포트를 라인별로 업로드해서 쌓아요.</div>

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
                <button
                  onClick={() => onDeleteSource(g.source)}
                  title={`${g.source} 캠페인 라이브러리 데이터 전체 삭제`}
                  className="text-[#9AA4B5] hover:text-[#C1442B] hover:bg-[#FBEAE6] rounded p-1 transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FileDropZone onFilesDropped={onFilesDropped} className="mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="text"
            value={libCampaignName}
            onChange={(e) => setLibCampaignName(e.target.value)}
            placeholder="캠페인명 입력"
            className={`${input} w-44`}
          />

          {customLineMode ? (
            <input
              type="text"
              list="lib-line-suggestions"
              value={libUploadLine}
              onChange={(e) => setLibUploadLine(e.target.value)}
              placeholder="라인명 (예: 데스크탑_2039)"
              className={`${input} w-44`}
            />
          ) : (
            <select
              value={libUploadLine}
              onChange={(e) => {
                if (e.target.value === CUSTOM) {
                  setCustomLineMode(true);
                  setLibUploadLine("");
                } else {
                  setLibUploadLine(e.target.value);
                }
              }}
              className={`${input} w-44`}
            >
              {libLineOptionsForCampaign.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
              <option value={CUSTOM}>+ 새 라인명 직접 입력</option>
            </select>
          )}
          <datalist id="lib-line-suggestions">
            {libraryLineSuggestions.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>

          <button onClick={() => libraryFileRef.current?.click()} className={btn}>
            <Upload size={14} /> 종료 캠페인 리포트 업로드
          </button>
          <input ref={libraryFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} className="hidden" />

          <button onClick={() => libBatchFileRef.current?.click()} className={btn}>
            <Files size={14} /> 여러 파일 한번에 업로드
          </button>
          <input ref={libBatchFileRef} type="file" accept=".xlsx,.xls,.csv" multiple onChange={onLibBatchFilesSelected} className="hidden" />
        </div>
      </FileDropZone>
      {libBatchFiles && (
        <BatchUploadModal
          files={libBatchFiles}
          assignments={libBatchAssignments}
          lineOptions={libLineOptionsForCampaign}
          onChangeAssignment={onChangeLibBatchAssignment}
          onConfirm={onConfirmLibBatchUpload}
          onCancel={onCancelLibBatchUpload}
          allowCustom
        />
      )}

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
          {/* 박스 그리드 대신 얇은 구분선 + 여백만으로 정렬한 리스트. 테두리를 없애고
              폰트 굵기/색으로만 위계를 줘서 촘촘해도 답답해 보이지 않게 했다. */}
          <div className="sm:columns-2 xl:columns-3 gap-x-14 [column-rule:1px_solid_#E5E9F0]">
            {[...libraryProfiles]
              .filter((l) => libViewLine === "전체" || (l.line === libViewLine && l.imps > 0))
              .sort((a, b) => profileMetrics(b).vtr - profileMetrics(a).vtr)
              .map((l) => {
                const { vtr, ctr } = profileMetrics(l);
                return (
                  <div key={l.id} className="flex items-baseline gap-2 py-2 border-b border-[#F1F3F6] break-inside-avoid">
                    <span className="text-[12.5px] font-medium text-[#1E293B] truncate max-w-[170px]" title={l.media}>
                      {l.media}
                    </span>
                    {libViewLine === "전체" && (
                      <span className="text-[10px] text-[#B0B8C4] truncate max-w-[60px] shrink-0" title={l.line}>
                        {l.line}
                      </span>
                    )}
                    <div className="flex items-baseline gap-2.5 tabular-nums shrink-0">
                      <span className="text-[10px] text-[#C2C8D2]">{l.campaignCount}건</span>
                      <span className="text-[13px] font-semibold text-[#0F172A] w-11 text-right">{fmt(vtr)}%</span>
                      <span className="text-[12px] text-[#64748B] w-10 text-right">{fmt(ctr)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
