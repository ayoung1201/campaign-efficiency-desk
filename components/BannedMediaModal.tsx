"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { btn, btnPrimary, input, panel, panelTitle } from "./ui";

interface BannedMediaModalProps {
  campaignName: string;
  availableMedia: string[]; // 이 캠페인 + 라이브러리에서 알려진 매체명 전체 (검색/선택 대상)
  selected: string[]; // 현재 노출 불가로 지정된 매체명 목록
  onToggle: (media: string) => void;
  onRemove: (media: string) => void;
  onAddCustom: (media: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function BannedMediaModal({
  campaignName,
  availableMedia,
  selected,
  onToggle,
  onRemove,
  onAddCustom,
  onSave,
  onCancel,
}: BannedMediaModalProps) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableMedia;
    return availableMedia.filter((m) => m.toLowerCase().includes(q));
  }, [availableMedia, query]);

  // 검색어와 정확히 일치하는 매체가 목록에 없으면, 직접 추가할 수 있게 해준다 (아직 어디에도 없는 매체명)
  const exactMatchExists = availableMedia.some((m) => m.toLowerCase() === query.trim().toLowerCase());
  const canAddCustom = query.trim().length > 0 && !exactMatchExists;

  return (
    <div className={`${panel} p-4 mb-4`}>
      <div className={`${panelTitle} mb-1`}>&quot;{campaignName}&quot; 노출 불가 매체 관리</div>
      <div className="text-[11.5px] text-[#8792A6] mb-3">
        여기 등록된 매체는 &quot;조정 추천&quot;에서 절대 추가 후보로 제안되지 않아요. 이미 실적이 잡혀 있으면 매체 상세에 경고로 표시돼요.
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full bg-[#FBEAE6] border border-[#E7C9C2] text-[#C1442B]">
              {m}
              <button onClick={() => onRemove(m)} className="hover:text-[#8A2F1D] font-bold">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA4B5]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="매체 검색..."
          className={`${input} w-full pl-8`}
        />
      </div>

      <div className="border border-[#E1E5EC] rounded-md max-h-56 overflow-y-auto mb-3">
        {filtered.length === 0 && !canAddCustom && (
          <div className="text-[12.5px] text-[#8792A6] px-3 py-3 text-center">일치하는 매체가 없어요.</div>
        )}
        {canAddCustom && (
          <button
            onClick={() => {
              onAddCustom(query.trim());
              setQuery("");
            }}
            className="w-full text-left px-3 py-2 text-[12.5px] text-[#0B1220] font-semibold hover:bg-[#F4F6F9] border-b border-[#EEF0F4]"
          >
            + &quot;{query.trim()}&quot; 직접 추가 (목록에 없는 매체)
          </button>
        )}
        {filtered.map((m) => {
          const checked = selectedSet.has(m);
          return (
            <label key={m} className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#F4F6F9] cursor-pointer border-b border-[#EEF0F4] last:border-b-0">
              <input type="checkbox" checked={checked} onChange={() => onToggle(m)} className="accent-[#0B1220]" />
              <span className={checked ? "text-[#C1442B] font-medium" : "text-[#334155]"}>{m}</span>
            </label>
          );
        })}
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
