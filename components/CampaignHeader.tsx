"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { Campaign } from "../lib/types";
import { btnDanger } from "./ui";

interface CampaignHeaderProps {
  active: Campaign;
  showStatusBadge: boolean;
  statusMet: boolean;
  onReset: (c: Campaign) => void;
  onDelete: (c: Campaign) => void;
}

export default function CampaignHeader({ active, showStatusBadge, statusMet, onReset, onDelete }: CampaignHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-[20px] font-bold">{active.name}</h1>
        {showStatusBadge && (
          <div
            className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border ${
              statusMet ? "text-[#0E8074] border-[#BFE3DB] bg-[#E9F5F2]" : "text-[#C1442B] border-[#E7C9C2] bg-[#FBEAE6]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusMet ? "bg-[#0E8074]" : "bg-[#C1442B]"}`} />
            {statusMet ? "금일 목표 범위 안" : "금일 목표 범위 밖"}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onReset(active)} className={btnDanger} title="매체 리포트 데이터만 삭제, 캠페인명/라인은 유지">
          <RotateCcw size={13} /> 데이터 초기화
        </button>
        <button onClick={() => onDelete(active)} className={btnDanger} title="캠페인 전체 삭제">
          <Trash2 size={13} /> 캠페인 삭제
        </button>
      </div>
    </div>
  );
}
