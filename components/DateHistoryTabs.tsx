"use client";

import { CalendarClock, Trash2 } from "lucide-react";
import { panel } from "./ui";

interface DateHistoryTabsProps {
  dates: string[]; // 최신순 정렬, 오늘 날짜 포함
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
  onDeleteDate: (date: string) => void;
}

// 날짜가 바뀌어도 예전에 업로드했던 날짜 기록을 눌러서 다시 볼 수 있게 해주는 탭.
// 오늘 리포트가 아직 없어도, 과거 날짜를 눌러서 그날 실적은 계속 조회할 수 있다.
export default function DateHistoryTabs({ dates, selectedDate, today, onSelect, onDeleteDate }: DateHistoryTabsProps) {
  if (dates.length <= 1) return null;

  return (
    <div className={`${panel} px-3 py-2 flex items-center gap-1.5 flex-wrap`}>
      <CalendarClock size={14} className="text-[#8792A6] shrink-0 ml-1" />
      {dates.map((d) => {
        const isSelected = d === selectedDate;
        const isToday = d === today;
        return (
          <div
            key={d}
            className={`group flex items-center rounded-md transition-colors ${isSelected ? "bg-[#0B1220]" : "hover:bg-[#F4F6F9]"}`}
          >
            <button onClick={() => onSelect(d)} className={`pl-2.5 pr-1 py-1 text-[12.5px] font-medium ${isSelected ? "text-white" : "text-[#4A5568]"}`}>
              {d}
              {isToday && <span className={isSelected ? "text-[#8CA0C6]" : "text-[#9AA4B5]"}> · 오늘</span>}
            </button>
            <button
              onClick={() => onDeleteDate(d)}
              title={`${d} 데이터 삭제`}
              className={`opacity-0 group-hover:opacity-100 px-1.5 py-1 transition-opacity ${
                isSelected ? "text-[#8CA0C6] hover:text-white" : "text-[#9AA4B5] hover:text-[#C1442B]"
              }`}
            >
              <Trash2 size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
