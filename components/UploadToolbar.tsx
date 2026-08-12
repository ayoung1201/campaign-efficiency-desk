"use client";

import { RefObject } from "react";
import { Ban, Files, SlidersHorizontal, Upload } from "lucide-react";
import FileDropZone from "./FileDropZone";
import { btn, input, toolbarGroup } from "./ui";

interface UploadToolbarProps {
  uploadLine: string;
  setUploadLine: (l: string) => void;
  lineOptions: string[];
  mediaFileRef: RefObject<HTMLInputElement | null>;
  onMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLineManager: () => void;
  onOpenBannedMediaManager: () => void;
  batchFileRef: RefObject<HTMLInputElement | null>;
  onBatchFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilesDropped: (files: File[]) => void;
}

export default function UploadToolbar({
  uploadLine,
  setUploadLine,
  lineOptions,
  mediaFileRef,
  onMediaUpload,
  onOpenLineManager,
  onOpenBannedMediaManager,
  batchFileRef,
  onBatchFilesSelected,
  onFilesDropped,
}: UploadToolbarProps) {
  return (
    <>
      <FileDropZone onFilesDropped={onFilesDropped} className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className={toolbarGroup}>
            <select value={uploadLine} onChange={(e) => setUploadLine(e.target.value)} className={`${input} border-none bg-[#F4F6F9]`}>
              {lineOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <button onClick={() => mediaFileRef.current?.click()} className={btn}>
              <Upload size={14} /> 매체 리포트 업로드
            </button>
            <input ref={mediaFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onMediaUpload} className="hidden" />
            <button onClick={onOpenLineManager} className={btn}>
              <SlidersHorizontal size={14} /> 라인 관리
            </button>
            <button onClick={onOpenBannedMediaManager} className={btn}>
              <Ban size={14} /> 노출 불가 매체
            </button>
          </div>

          <div className={toolbarGroup}>
            <button onClick={() => batchFileRef.current?.click()} className={btn}>
              <Files size={14} /> 여러 파일 한번에 업로드
            </button>
            <input ref={batchFileRef} type="file" accept=".xlsx,.xls,.csv" multiple onChange={onBatchFilesSelected} className="hidden" />
          </div>
        </div>
      </FileDropZone>

      <div className="text-[11.5px] text-[#8792A6] mb-4 -mt-2">
        라인 선택은 <b>① 업로드할 파일이 어느 라인 것인지</b>, <b>② 오른쪽 매체 표를 어느 라인만 필터해서 볼지</b> 둘 다에 사용돼요. &quot;전체&quot;를 선택하면 모든 라인을 라인별로 묶어서 보여줘요.
      </div>
    </>
  );
}
