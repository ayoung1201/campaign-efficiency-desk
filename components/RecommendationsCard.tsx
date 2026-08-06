"use client";

import { Lightbulb } from "lucide-react";
import { canonicalLine, fmt, profileMetrics, RecommendationBundle } from "../lib/calculations";
import { LibraryProfile } from "../lib/types";
import SectionTitle from "./SectionTitle";
import { panel } from "./ui";

const ACCENT = "#7C3AED";

interface RecommendationsCardProps {
  recommendations: RecommendationBundle[];
  statusMet: boolean;
  libraryByKey: Map<string, LibraryProfile>;
}

export default function RecommendationsCard({ recommendations, statusMet, libraryByKey }: RecommendationsCardProps) {
  return (
    <div className={`${panel} p-4`}>
      <SectionTitle icon={Lightbulb} color={ACCENT}>
        조정 추천
      </SectionTitle>
      {recommendations.length === 0 ? (
        <div className="text-[13px] text-[#8792A6]">
          {statusMet ? "남은 예산을 지금 구성대로 쓰면 목표 범위 안에 들어올 것으로 예상돼요." : "현재 데이터에서는 뚜렷한 개선 후보가 없어요."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
          {recommendations.map((bundle) => {
            const isBest = bundle.rank === 1;
            return (
              <div
                key={bundle.rank}
                className={`rounded-lg border p-3 flex flex-col ${isBest ? "border-[#7C3AED] bg-[#FAF8FF]" : "border-[#E1E5EC] bg-[#FAFBFC]"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                      isBest ? "bg-[#7C3AED] text-white" : "bg-[#E1E5EC] text-[#4A5568]"
                    }`}
                  >
                    {bundle.rank}순위
                  </span>
                  <span className="text-[11px] text-[#8792A6]">매체 {bundle.actions.length}개</span>
                </div>

                <div className="flex flex-col gap-1.5 mb-2.5">
                  {bundle.actions.map((a) => {
                    const libKey = `${a.profile.media}__${canonicalLine(a.profile.line)}`;
                    const libMatch = libraryByKey.get(libKey);
                    const lib = libMatch ? profileMetrics(libMatch) : null;
                    const isCut = a.action === "제외";
                    const isNewCandidate = a.action === "추가" && a.profile.days === 0; // 아직 이 캠페인에 없는, 라이브러리 기반 신규 추천 매체
                    return (
                      <div
                        key={a.profile.id}
                        className={`px-2 py-1.5 rounded border-l-2 text-[12px] ${isCut ? "border-l-[#C1442B] bg-[#FBEAE6]" : "border-l-[#0E8074] bg-[#E9F5F2]"}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold truncate">
                            {a.profile.media} <span className="text-[#8792A6] font-normal">({a.profile.line})</span>
                          </span>
                          <span className={`shrink-0 font-bold ${isCut ? "text-[#C1442B]" : "text-[#0E8074]"}`}>{a.action}</span>
                        </div>
                        {lib && (
                          <div className="text-[10.5px] text-[#8792A6] mt-0.5">
                            {isNewCandidate && "신규 · "}
                            라이브러리 평균 VTR {fmt(lib.vtr)}% · CTR {fmt(lib.ctr)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto pt-2 border-t border-[#EEF0F4] text-[11px] text-[#8792A6] flex justify-between gap-2">
                  <span>
                    VTR {fmt(bundle.proj.vtr)}%{" "}
                    <span className={bundle.deltaVTR >= 0 ? "text-[#0E8074]" : "text-[#C1442B]"}>
                      ({bundle.deltaVTR >= 0 ? "+" : ""}
                      {fmt(bundle.deltaVTR)}%p)
                    </span>
                  </span>
                  <span>
                    CTR {fmt(bundle.proj.ctr)}%{" "}
                    <span className={bundle.deltaCTR >= 0 ? "text-[#0E8074]" : "text-[#C1442B]"}>
                      ({bundle.deltaCTR >= 0 ? "+" : ""}
                      {fmt(bundle.deltaCTR)}%p)
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
