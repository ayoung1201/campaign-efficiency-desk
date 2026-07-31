"use client";

import { Wallet } from "lucide-react";
import { fmtHoursMinutes, fmtInt } from "../lib/calculations";
import SectionTitle from "./SectionTitle";
import { input, label, panel } from "./ui";

const ACCENT = "#B45309";

interface BudgetCardProps {
  dailyBudget: number;
  onChangeDailyBudget: (value: number) => void;
  remainingBudget: number;
  remainingHrs: number;
}

export default function BudgetCard({ dailyBudget, onChangeDailyBudget, remainingBudget, remainingHrs }: BudgetCardProps) {
  return (
    <div className={`${panel} p-4`}>
      <SectionTitle icon={Wallet} color={ACCENT}>
        일예산 &amp; 남은 예산
      </SectionTitle>
      <div className="flex gap-6 text-[13px] items-end flex-wrap">
        <div>
          <div className={`${label} mb-1`}>일예산(원)</div>
          <input
            type="number"
            value={dailyBudget}
            onChange={(e) => onChangeDailyBudget(parseFloat(e.target.value) || 0)}
            className={`${input} w-32 tabular-nums font-bold`}
          />
        </div>
        <div>
          <div className={label}>남은 예산</div>
          <div className="font-bold text-[17px] tabular-nums">{fmtInt(remainingBudget)}원</div>
        </div>
        <div>
          <div className={label}>남은 시간</div>
          <div className="font-bold text-[17px] tabular-nums">{fmtHoursMinutes(remainingHrs)}</div>
        </div>
      </div>
    </div>
  );
}
