"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";
import { fmtHoursMinutes, fmtInt } from "../lib/calculations";
import { label, panel } from "./ui";

const ACCENT = "#B45309";

interface BudgetCardProps {
  dailyBudget: number;
  onChangeDailyBudget: (value: number) => void;
  remainingBudget: number;
  remainingHrs: number;
  isManualOverride: boolean; // 일예산을 직접 입력해뒀는지 - 그렇다면 총예산/기간 자동계산보다 그 값이 우선 적용된다
  onClearOverride: () => void;
  totalBudget: number | null;
  budgetStartDate: string | null;
  budgetEndDate: string | null;
  periodDailyBudget: number | null; // 총예산 ÷ 기간으로 계산된 값 (둘 다 입력했을 때만 존재)
  onChangeTotalBudget: (value: number) => void;
  onChangeBudgetStartDate: (value: string) => void;
  onChangeBudgetEndDate: (value: string) => void;
}

// 전체 너비를 쓰는 슬림한 가로 바 형태 - 라인별 실적 카드와 나란히 두면 높이가 안 맞아 빈 공간이
// 생기던 문제를 없애기 위해, 짧은 내용에 맞는 한 줄짜리 레이아웃으로 뒀다.
//
// 숫자 입력창은 키 입력마다 바로 DB에 쓰지 않는다 - 타이핑 중간값이나 입력창 위 실수 스크롤이 그대로
// 저장돼버리는 걸 막기 위해, 로컬 상태로만 편집하다가 blur(포커스 아웃) 시점에만 커밋한다.
// (page.tsx에서 key={active.id}로 렌더링해서 캠페인이 바뀌면 이 로컬 상태도 자연스럽게 리셋된다.)
export default function BudgetCard({
  dailyBudget,
  onChangeDailyBudget,
  remainingBudget,
  remainingHrs,
  isManualOverride,
  onClearOverride,
  totalBudget,
  budgetStartDate,
  budgetEndDate,
  periodDailyBudget,
  onChangeTotalBudget,
  onChangeBudgetStartDate,
  onChangeBudgetEndDate,
}: BudgetCardProps) {
  const [dailyBudgetInput, setDailyBudgetInput] = useState(String(dailyBudget));
  const [totalBudgetInput, setTotalBudgetInput] = useState(totalBudget !== null ? String(totalBudget) : "");
  const dailyBudgetFocused = useRef(false);

  // 직접 입력해두지 않았을 땐 일예산이 시간에 따라 계속 재추정되므로(총예산/기간 계산 or 소진 속도 추정),
  // 편집 중이 아닐 때는 최신 값을 계속 따라가게 동기화한다. 편집 중엔 타이핑을 방해하지 않도록 건드리지 않는다.
  useEffect(() => {
    if (!dailyBudgetFocused.current) setDailyBudgetInput(String(dailyBudget));
  }, [dailyBudget]);

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
    <div className={`${panel} px-4 py-3 flex flex-col gap-3`}>
      <div className="flex items-center gap-6 flex-wrap">
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
            value={dailyBudgetInput}
            onFocus={() => {
              dailyBudgetFocused.current = true;
            }}
            onChange={(e) => setDailyBudgetInput(e.target.value)}
            onBlur={(e) => {
              dailyBudgetFocused.current = false;
              commitOnBlur(e.target.value, dailyBudget, onChangeDailyBudget, setDailyBudgetInput);
            }}
            onKeyDown={blurOnEnter}
            className="px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220] w-28 tabular-nums font-bold"
          />
          {isManualOverride && periodDailyBudget !== null && (
            <button
              onClick={() => {
                onClearOverride();
                setDailyBudgetInput(String(Math.round(periodDailyBudget)));
              }}
              className="text-[11px] text-[#8792A6] hover:text-[#0B1220] underline underline-offset-2"
            >
              자동 계산값({fmtInt(periodDailyBudget)}원)으로 되돌리기
            </button>
          )}
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

      <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-[#EEF0F4]">
        <div className="flex items-center gap-2">
          <div className={label}>총예산(원)</div>
          <input
            type="number"
            value={totalBudgetInput}
            onChange={(e) => setTotalBudgetInput(e.target.value)}
            onBlur={(e) => commitOnBlur(e.target.value, totalBudget ?? 0, onChangeTotalBudget, setTotalBudgetInput)}
            onKeyDown={blurOnEnter}
            placeholder="예: 6000000"
            className="px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220] w-32 tabular-nums"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className={label}>기간</div>
          <input
            type="date"
            value={budgetStartDate ?? ""}
            onChange={(e) => onChangeBudgetStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220]"
          />
          <span className="text-[#9AA4B5]">~</span>
          <input
            type="date"
            value={budgetEndDate ?? ""}
            onChange={(e) => onChangeBudgetEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220]"
          />
        </div>
        {periodDailyBudget !== null && (
          <div className="text-[11.5px] text-[#9AA4B5]">
            → 자동 계산 일예산 <b className="text-[#4A5568]">{fmtInt(periodDailyBudget)}원</b>
            {isManualOverride && " (지금은 위 직접 입력값이 우선 적용 중)"}
          </div>
        )}
      </div>
    </div>
  );
}
