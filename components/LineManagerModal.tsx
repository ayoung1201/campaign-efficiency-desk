"use client";

import { btn, btnPrimary, input, panel, panelTitle } from "./ui";

interface LineManagerModalProps {
  campaignName: string;
  editLines: string[];
  updateEditLine: (i: number, value: string) => void;
  addEditLineField: () => void;
  removeEditLineField: (i: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function LineManagerModal({
  campaignName,
  editLines,
  updateEditLine,
  addEditLineField,
  removeEditLineField,
  onSave,
  onCancel,
}: LineManagerModalProps) {
  return (
    <div className={`${panel} p-4 mb-4`}>
      <div className={`${panelTitle} mb-3`}>&quot;{campaignName}&quot; 라인 구성 편집</div>
      <div className="flex flex-col gap-1.5 mb-3">
        {editLines.map((l, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={l}
              onChange={(e) => updateEditLine(i, e.target.value)}
              placeholder={["데스크탑", "모바일app", "모바일web"][i] || "라인명 입력"}
              className={`${input} w-56`}
            />
            {editLines.length > 1 && (
              <button onClick={() => removeEditLineField(i)} className="text-[#9AA4B5] hover:text-[#C1442B] text-xs px-1">
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={addEditLineField} className="text-[12px] font-semibold text-[#0B1220] self-start mt-1 hover:underline">
          + 라인 추가
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className={btnPrimary}>
          저장
        </button>
        <button onClick={onCancel} className={btn}>
          취소
        </button>
      </div>
    </div>
  );
}
