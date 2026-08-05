"use client";

import { CalendarClock } from "lucide-react";
import { panel } from "./ui";

interface DateHistoryTabsProps {
  dates: string[]; // 최신순 정렬, 오늘 날짜 포함
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}

// 날짜가 바뀌어도 예전에 업로드했던 날짜 기록을 눌러서 다시 볼 수 있게 해주는 탭.
// 오늘 리포트가 아직 없어도, 과거 날짜를 눌러서 그날 실적은 계속 조회할 수 있다.
export default function DateHistoryTabs({ dates, selectedDate, today, onSelect }: DateHistoryTabsProps) {
  if (dates.length <= 1) return null;

  return (
    <div className={`${panel} px-3 py-2 flex items-center gap-1.5 flex-wrap`}>
      <CalendarClock size={14} className="text-[#8792A6] shrink-0 ml-1" />
      {dates.map((d) => {
        const isSelected = d === selectedDate;
        const isToday = d === today;
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={`px-2.5 py-1 rounded-md text-[12.5px] font-medium transition-colors ${
              isSelected ? "bg-[#0B1220] text-white" : "text-[#4A5568] hover:bg-[#F4F6F9]"
            }`}
          >
            {d}
            {isToday && <span className={isSelected ? "text-[#8CA0C6]" : "text-[#9AA4B5]"}> · 오늘</span>}
          </button>
        );
      })}
    </div>
  );
}
