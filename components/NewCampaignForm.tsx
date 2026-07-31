"use client";

import { btn, btnPrimary, input, label, panel, panelTitle } from "./ui";

interface NewCampaignFormProps {
  newName: string;
  setNewName: (v: string) => void;
  newLines: string[];
  updateNewLine: (i: number, value: string) => void;
  addNewLineField: () => void;
  removeNewLineField: (i: number) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export default function NewCampaignForm({
  newName,
  setNewName,
  newLines,
  updateNewLine,
  addNewLineField,
  removeNewLineField,
  onCreate,
  onCancel,
}: NewCampaignFormProps) {
  return (
    <div className={`${panel} p-4 mb-5`}>
      <div className={`${panelTitle} mb-3`}>새 캠페인 등록</div>
      <div className="mb-3">
        <label className={`${label} block mb-1`}>캠페인명</label>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={`${input} w-64`} placeholder="캠페인명 입력" />
      </div>
      <div className="mb-3">
        <label className={`${label} block mb-1`}>라인 구성 (이 캠페인에 실제 존재하는 라인만큼 입력)</label>
        <div className="flex flex-col gap-1.5">
          {newLines.map((l, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input
                type="text"
                value={l}
                onChange={(e) => updateNewLine(i, e.target.value)}
                placeholder={["데스크탑", "모바일app", "모바일web"][i] || "라인명 입력"}
                className={`${input} w-56`}
              />
              {newLines.length > 1 && (
                <button onClick={() => removeNewLineField(i)} className="text-[#9AA4B5] hover:text-[#C1442B] text-xs px-1">
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addNewLineField} className="text-[12px] font-semibold text-[#0B1220] self-start mt-1 hover:underline">
            + 라인 추가
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCreate} className={btnPrimary}>
          캠페인 만들기
        </button>
        <button onClick={onCancel} className={btn}>
          취소
        </button>
      </div>
    </div>
  );
}
