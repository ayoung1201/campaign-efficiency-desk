"use client";

import { Library, Plus } from "lucide-react";
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
  targetVTRMin: number;
  targetVTRMax: number;
  targetCTRMin: number;
  targetCTRMax: number;
  setTargetVTRMin: (v: number) => void;
  setTargetVTRMax: (v: number) => void;
  setTargetCTRMin: (v: number) => void;
  setTargetCTRMax: (v: number) => void;
}

export default function Sidebar({
  campaigns,
  activeId,
  showNewForm,
  showLibraryPanel,
  onSelectCampaign,
  onToggleNewForm,
  onShowLibrary,
  targetVTRMin,
  targetVTRMax,
  targetCTRMin,
  targetCTRMax,
  setTargetVTRMin,
  setTargetVTRMax,
  setTargetCTRMin,
  setTargetCTRMax,
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

      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5A6C8F] mb-2">목표 범위</div>
        <div className="flex items-center gap-1.5 text-[12px] mb-1.5">
          <label className="w-8 text-[#8CA0C6] font-semibold">VTR</label>
          <input type="number" value={targetVTRMin} onChange={(e) => setTargetVTRMin(parseFloat(e.target.value) || 0)} className={sidebarNumInput} />
          <span className="text-[#5A6C8F]">~</span>
          <input type="number" value={targetVTRMax} onChange={(e) => setTargetVTRMax(parseFloat(e.target.value) || 0)} className={sidebarNumInput} />
        </div>
        <div className="flex items-center gap-1.5 text-[12px]">
          <label className="w-8 text-[#8CA0C6] font-semibold">CTR</label>
          <input type="number" step="0.1" value={targetCTRMin} onChange={(e) => setTargetCTRMin(parseFloat(e.target.value) || 0)} className={sidebarNumInput} />
          <span className="text-[#5A6C8F]">~</span>
          <input type="number" step="0.1" value={targetCTRMax} onChange={(e) => setTargetCTRMax(parseFloat(e.target.value) || 0)} className={sidebarNumInput} />
        </div>
      </div>
    </aside>
  );
}
