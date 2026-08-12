"use client";

import { TrendingUp } from "lucide-react";
import { fmtInt } from "../lib/calculations";
import { Stats } from "../lib/types";
import Gauge from "./Gauge";
import SectionTitle from "./SectionTitle";
import { label, panel } from "./ui";

const ACCENT = "#0EA5E9";

interface ProjectionCardProps {
  currentProjection: Stats;
  statusMet: boolean;
  targetVTRMin: number;
  targetVTRMax: number;
  targetCTRMin: number;
  targetCTRMax: number;
}

// 지금 매체 상세에서 체크한 포함/제외 구성을 남은 예산에 그대로 적용했을 때, 오늘 마감 시점에
// 예상되는 최종 효율. 체크박스를 켜고 끌 때 그 효과를 바로 확인할 수 있도록 보여주는 카드.
export default function ProjectionCard({
  currentProjection,
  statusMet,
  targetVTRMin,
  targetVTRMax,
  targetCTRMin,
  targetCTRMax,
}: ProjectionCardProps) {
  return (
    <div className={`${panel} p-4 h-full flex flex-col`}>
      <SectionTitle
        icon={TrendingUp}
        color={ACCENT}
        right={
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              statusMet ? "text-[#0E8074] bg-[#E9F5F2]" : "text-[#C1442B] bg-[#FBEAE6]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusMet ? "bg-[#0E8074]" : "bg-[#C1442B]"}`} />
            {statusMet ? "범위 안" : "범위 밖"}
          </div>
        }
      >
        예상 최종 효율
      </SectionTitle>
      <div className="text-[11px] text-[#9AA4B5] mb-4">지금 매체 상세에서 체크한 구성대로 남은 예산을 쓰면 오늘 마감 시점 예상치</div>
      <div className="grid grid-cols-2 gap-2.5">
        <Gauge label="VTR" value={currentProjection.vtr} rangeMin={targetVTRMin} rangeMax={targetVTRMax} />
        <Gauge label="CTR" value={currentProjection.ctr} rangeMin={targetCTRMin} rangeMax={targetCTRMax} />
      </div>
      <div className="flex justify-center gap-8 text-[13px] pt-4 mt-4 border-t border-[#EEF0F4]">
        <div>
          <div className={label}>예상 Imps.</div>
          <div className="font-bold text-[16px] tabular-nums">{fmtInt(currentProjection.imps)}</div>
        </div>
        <div>
          <div className={label}>예상 소진액</div>
          <div className="font-bold text-[16px] tabular-nums">{fmtInt(currentProjection.spend)}원</div>
        </div>
      </div>
    </div>
  );
}
