"use client";

import { btn, btnPrimary, input, panel, panelTitle } from "./ui";

interface BannedMediaModalProps {
  campaignName: string;
  editBannedMedia: string[];
  updateEditBannedMedia: (i: number, value: string) => void;
  addEditBannedMediaField: () => void;
  removeEditBannedMediaField: (i: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function BannedMediaModal({
  campaignName,
  editBannedMedia,
  updateEditBannedMedia,
  addEditBannedMediaField,
  removeEditBannedMediaField,
  onSave,
  onCancel,
}: BannedMediaModalProps) {
  return (
    <div className={`${panel} p-4 mb-4`}>
      <div className={`${panelTitle} mb-1`}>&quot;{campaignName}&quot; 노출 불가 매체 관리</div>
      <div className="text-[11.5px] text-[#8792A6] mb-3">
        여기 등록된 매체는 &quot;조정 추천&quot;에서 절대 추가 후보로 제안되지 않아요. 이미 실적이 잡혀 있으면 매체 상세에 경고로 표시돼요.
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        {editBannedMedia.map((l, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={l}
              onChange={(e) => updateEditBannedMedia(i, e.target.value)}
              placeholder="매체명 입력 (예: 더줌코리아_캐시워크)"
              className={`${input} w-64`}
            />
            {editBannedMedia.length > 1 && (
              <button onClick={() => removeEditBannedMediaField(i)} className="text-[#9AA4B5] hover:text-[#C1442B] text-xs px-1">
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={addEditBannedMediaField} className="text-[12px] font-semibold text-[#0B1220] self-start mt-1 hover:underline">
          + 매체 추가
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
