"use client";

import { Wallet } from "lucide-react";
import { fmtHoursMinutes, fmtInt } from "../lib/calculations";
import { label, panel } from "./ui";

const ACCENT = "#B45309";

interface BudgetCardProps {
  dailyBudget: number;
  onChangeDailyBudget: (value: number) => void;
  remainingBudget: number;
  remainingHrs: number;
}

// 전체 너비를 쓰는 슬림한 가로 바 형태 - 라인별 실적 카드와 나란히 두면 높이가 안 맞아 빈 공간이
// 생기던 문제를 없애기 위해, 짧은 내용에 맞는 한 줄짜리 레이아웃으로 뒀다.
export default function BudgetCard({ dailyBudget, onChangeDailyBudget, remainingBudget, remainingHrs }: BudgetCardProps) {
  return (
    <div className={`${panel} px-4 py-3 flex items-center gap-6 flex-wrap`}>
      <div className="flex items-center gap-1.5 shrink-0">
        <Wallet size={14} style={{ color: ACCENT }} />
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
          예산
        </span>
      </div>

      <div className="w-px self-stretch bg-[#EEF0F4]" />

      <div className="flex items-center gap-2">
        <div className={label}>일예산(원)</div>
        <input
          type="number"
          value={dailyBudget}
          onChange={(e) => onChangeDailyBudget(parseFloat(e.target.value) || 0)}
          className="px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220] w-28 tabular-nums font-bold"
        />
      </div>

      <div className="flex flex-col">
        <div className={label}>남은 예산</div>
        <div className="font-bold text-[16px] tabular-nums leading-tight">{fmtInt(remainingBudget)}원</div>
      </div>

      <div className="flex flex-col">
        <div className={label}>남은 시간</div>
        <div className="font-bold text-[16px] tabular-nums leading-tight">{fmtHoursMinutes(remainingHrs)}</div>
      </div>
    </div>
  );
}
