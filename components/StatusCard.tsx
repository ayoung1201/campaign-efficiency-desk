"use client";

import { Activity } from "lucide-react";
import { fmtInt } from "../lib/calculations";
import { Stats } from "../lib/types";
import Gauge from "./Gauge";
import SectionTitle from "./SectionTitle";
import { label, panel } from "./ui";

const ACCENT = "#4F46E5";

interface StatusCardProps {
  uploadLine: string;
  elapsedDisplay: number;
  gaugeStats: Stats;
  gaugeInRange: boolean;
  targetVTRMin: number;
  targetVTRMax: number;
  targetCTRMin: number;
  targetCTRMax: number;
}

export default function StatusCard({
  uploadLine,
  elapsedDisplay,
  gaugeStats,
  gaugeInRange,
  targetVTRMin,
  targetVTRMax,
  targetCTRMin,
  targetCTRMax,
}: StatusCardProps) {
  return (
    <div className={`${panel} p-4`}>
      <SectionTitle
        icon={Activity}
        color={ACCENT}
        right={
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              gaugeInRange ? "text-[#0E8074] bg-[#E9F5F2]" : "text-[#C1442B] bg-[#FBEAE6]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${gaugeInRange ? "bg-[#0E8074]" : "bg-[#C1442B]"}`} />
            {gaugeInRange ? "범위 안" : "범위 밖"}
          </div>
        }
      >
        금일 진행 현황 {uploadLine !== "전체" && <span className="normal-case font-medium text-[#8792A6]">· {uploadLine}</span>}
      </SectionTitle>
      <div className="text-[11px] text-[#9AA4B5] mb-4">00:00 ~ {String(elapsedDisplay).padStart(2, "0")}:00 현재</div>
      <div className="flex flex-col gap-2.5">
        <Gauge label="VTR" value={gaugeStats.vtr} rangeMin={targetVTRMin} rangeMax={targetVTRMax} />
        <Gauge label="CTR" value={gaugeStats.ctr} rangeMin={targetCTRMin} rangeMax={targetCTRMax} />
      </div>
      <div className="flex justify-center gap-8 text-[13px] pt-4 mt-4 border-t border-[#EEF0F4]">
        <div>
          <div className={label}>Imps.</div>
          <div className="font-bold text-[16px] tabular-nums">{fmtInt(gaugeStats.imps)}</div>
        </div>
        <div>
          <div className={label}>소진액</div>
          <div className="font-bold text-[16px] tabular-nums">{fmtInt(gaugeStats.spend)}원</div>
        </div>
      </div>
    </div>
  );
}
