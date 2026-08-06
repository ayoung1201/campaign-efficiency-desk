"use client";

import { Library, Plus } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { Campaign } from "../lib/types";
import { navItem, sidebarNumInput } from "./ui";

interface SidebarProps {
  campaigns: Campaign[];
  activeId: string | null;
  showNewForm: boolean;
  showLibraryPanel: boolean;
  onSelectCampaign: (id: string) => void;
  onToggleNewForm: () => void;
  onShowLibrary: () => void;
  showTargetRange: boolean;
  targetVTRMin: number;
  targetVTRMax: number;
  targetCTRMin: number;
  targetCTRMax: number;
  onChangeTargetVTRMin: (v: number) => void;
  onChangeTargetVTRMax: (v: number) => void;
  onChangeTargetCTRMin: (v: number) => void;
  onChangeTargetCTRMax: (v: number) => void;
}

// 입력마다 바로 DB에 쓰면 타이핑 중간값이나(예: "70" 지우는 중 "" -> 0) 숫자 입력창 위에서의
// 실수 스크롤 값이 그대로 저장돼버리는 문제가 있어, 편집 중에는 로컬 상태로만 보여주고
// blur(포커스 아웃) 시점에만 실제로 커밋한다. activeId로 key를 줘서 캠페인이 바뀌면 이 컴포넌트
// 자체가 새로 마운트되며 로컬 상태가 자연스럽게 리셋된다.
interface TargetRangeEditorProps {
  targetVTRMin: number;
  targetVTRMax: number;
  targetCTRMin: number;
  targetCTRMax: number;
  onChangeTargetVTRMin: (v: number) => void;
  onChangeTargetVTRMax: (v: number) => void;
  onChangeTargetCTRMin: (v: number) => void;
  onChangeTargetCTRMax: (v: number) => void;
}

function TargetRangeEditor({
  targetVTRMin,
  targetVTRMax,
  targetCTRMin,
  targetCTRMax,
  onChangeTargetVTRMin,
  onChangeTargetVTRMax,
  onChangeTargetCTRMin,
  onChangeTargetCTRMax,
}: TargetRangeEditorProps) {
  const [vtrMin, setVtrMin] = useState(String(targetVTRMin));
  const [vtrMax, setVtrMax] = useState(String(targetVTRMax));
  const [ctrMin, setCtrMin] = useState(String(targetCTRMin));
  const [ctrMax, setCtrMax] = useState(String(targetCTRMax));

  const commitOnBlur = (raw: string, fallback: number, commit: (v: number) => void, reset: (v: string) => void) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      reset(String(fallback));
      return;
    }
    reset(String(parsed));
    if (parsed !== fallback) commit(parsed);
  };

  const blurOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div className="px-4 py-4 border-t border-white/10">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5A6C8F] mb-2">
        목표 범위 <span className="normal-case text-[#5A6C8F]/70 font-medium">(이 캠페인만)</span>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] mb-1.5">
        <label className="w-8 text-[#8CA0C6] font-semibold">VTR</label>
        <input
          type="number"
          value={vtrMin}
          onChange={(e) => setVtrMin(e.target.value)}
          onBlur={(e) => commitOnBlur(e.target.value, targetVTRMin, onChangeTargetVTRMin, setVtrMin)}
          onKeyDown={blurOnEnter}
          className={sidebarNumInput}
        />
        <span className="text-[#5A6C8F]">~</span>
        <input
          type="number"
          value={vtrMax}
          onChange={(e) => setVtrMax(e.target.value)}
          onBlur={(e) => commitOnBlur(e.target.value, targetVTRMax, onChangeTargetVTRMax, setVtrMax)}
          onKeyDown={blurOnEnter}
          className={sidebarNumInput}
        />
      </div>
      <div className="flex items-center gap-1.5 text-[12px]">
        <label className="w-8 text-[#8CA0C6] font-semibold">CTR</label>
        <input
          type="number"
          step="0.1"
          value={ctrMin}
          onChange={(e) => setCtrMin(e.target.value)}
          onBlur={(e) => commitOnBlur(e.target.value, targetCTRMin, onChangeTargetCTRMin, setCtrMin)}
          onKeyDown={blurOnEnter}
          className={sidebarNumInput}
        />
        <span className="text-[#5A6C8F]">~</span>
        <input
          type="number"
          step="0.1"
          value={ctrMax}
          onChange={(e) => setCtrMax(e.target.value)}
          onBlur={(e) => commitOnBlur(e.target.value, targetCTRMax, onChangeTargetCTRMax, setCtrMax)}
          onKeyDown={blurOnEnter}
          className={sidebarNumInput}
        />
      </div>
    </div>
  );
}

export default function Sidebar({
  campaigns,
  activeId,
  showNewForm,
  showLibraryPanel,
  onSelectCampaign,
  onToggleNewForm,
  onShowLibrary,
  showTargetRange,
  targetVTRMin,
  targetVTRMax,
  targetCTRMin,
  targetCTRMax,
  onChangeTargetVTRMin,
  onChangeTargetVTRMax,
  onChangeTargetCTRMin,
  onChangeTargetCTRMax,
}: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 bg-[#0B1220] text-[#E7EBF3] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-[13px] font-bold tracking-wide leading-tight">CAMPAIGN EFFICIENCY DESK</div>
        <div className="text-[11px] text-[#8CA0C6] mt-1.5 leading-snug">금일 목표 효율 달성 시뮬레이터</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#5A6C8F] px-3 mb-1.5">캠페인</div>
        <div className="flex flex-col gap-0.5 mb-1">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCampaign(c.id)}
              className={navItem(activeId === c.id && !showNewForm && !showLibraryPanel)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button onClick={onToggleNewForm} className={navItem(showNewForm)}>
          <Plus size={13} /> 캠페인 추가
        </button>

        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#5A6C8F] px-3 mt-6 mb-1.5">도구</div>
        <button onClick={onShowLibrary} className={navItem(showLibraryPanel)}>
          <Library size={14} /> 매체별 평균 효율
        </button>
      </nav>

      {showTargetRange && (
        <TargetRangeEditor
          key={activeId}
          targetVTRMin={targetVTRMin}
          targetVTRMax={targetVTRMax}
          targetCTRMin={targetCTRMin}
          targetCTRMax={targetCTRMax}
          onChangeTargetVTRMin={onChangeTargetVTRMin}
          onChangeTargetVTRMax={onChangeTargetVTRMax}
          onChangeTargetCTRMin={onChangeTargetCTRMin}
          onChangeTargetCTRMax={onChangeTargetCTRMax}
        />
      )}
    </aside>
  );
}
