"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionTitleProps {
  icon: LucideIcon;
  color: string;
  children: ReactNode;
  right?: ReactNode;
}

// 카드마다 색이 다른 아이콘 + 제목을 붙여서, 흑백 위주 화면에 구역별 색 구분을 준다.
export default function SectionTitle({ icon: Icon, color, children, right }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-1.5">
        <Icon size={14} style={{ color }} />
        <div className="text-[12px] font-semibold uppercase tracking-wide" style={{ color }}>
          {children}
        </div>
      </div>
      {right}
    </div>
  );
}
