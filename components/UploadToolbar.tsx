"use client";

import { RefObject } from "react";
import { Files, SlidersHorizontal, Upload } from "lucide-react";
import { btn, input, toolbarGroup } from "./ui";

interface UploadToolbarProps {
  uploadLine: string;
  setUploadLine: (l: string) => void;
  lineOptions: string[];
  mediaFileRef: RefObject<HTMLInputElement | null>;
  onMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLineManager: () => void;
  batchFileRef: RefObject<HTMLInputElement | null>;
  onBatchMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadToolbar({
  uploadLine,
  setUploadLine,
  lineOptions,
  mediaFileRef,
  onMediaUpload,
  onOpenLineManager,
  batchFileRef,
  onBatchMediaUpload,
}: UploadToolbarProps) {
  const lineOrder = lineOptions.slice(1).join(" → ") || "-";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
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
        </div>

        <div className={toolbarGroup}>
          <button
            onClick={() => batchFileRef.current?.click()}
            className={btn}
            title={`파일을 여러 개 선택하면 선택한 순서 그대로 아래 라인 순서에 매칭돼요:\n${lineOptions.slice(1).join(" → ") || "(등록된 라인 없음)"}`}
          >
            <Files size={14} /> 여러 파일 한번에 업로드
          </button>
          <input ref={batchFileRef} type="file" accept=".xlsx,.xls,.csv" multiple onChange={onBatchMediaUpload} className="hidden" />
        </div>
      </div>

      <div className="text-[11.5px] text-[#8792A6] mb-4 -mt-2">
        라인 선택은 <b>① 업로드할 파일이 어느 라인 것인지</b>, <b>② 오른쪽 매체 표를 어느 라인만 필터해서 볼지</b> 둘 다에 사용돼요. &quot;전체&quot;를 선택하면 모든 라인을 라인별로 묶어서 보여줘요.
        <br />
        <b>여러 파일 한번에 업로드</b>는 선택한 파일 순서를 라인 구성 순서({lineOrder})에 그대로 매칭해요. 파일 탐색기에서 원하는 순서대로 클릭해 선택해주세요.
      </div>
    </>
  );
}
