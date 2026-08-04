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
        <div className="flex flex-col gap-3">
          {recommendations.map((bundle) => (
            <div key={bundle.rank} className="px-3 py-2.5 rounded-lg border border-[#E1E5EC] bg-[#FAFBFC]">
              <div className="font-semibold text-[13px] mb-1.5">
                {bundle.rank}순위 조정 <span className="text-[#8792A6] font-normal">· 매체 {bundle.actions.length}개</span>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                {bundle.actions.map((a, idx) => {
                  const libKey = `${a.profile.media}__${canonicalLine(a.profile.line)}`;
                  const libMatch = libraryByKey.get(libKey);
                  const cur = profileMetrics(a.profile);
                  const lib = libMatch ? profileMetrics(libMatch) : null;
                  const isCut = a.action === "제외";
                  const isNewCandidate = a.action === "추가" && a.profile.days === 0; // 아직 이 캠페인에 없는, 라이브러리 기반 신규 추천 매체
                  return (
                    <div
                      key={a.profile.id}
                      className={`px-2.5 py-1.5 rounded-md border-l-2 text-[12.5px] ${isCut ? "border-l-[#C1442B] bg-[#FBEAE6]" : "border-l-[#0E8074] bg-[#E9F5F2]"}`}
                    >
                      <span className="font-semibold">
                        {idx + 1}. {a.profile.media} <span className="text-[#8792A6] font-normal">({a.profile.line})</span>
                      </span>{" "}
                      <span className={`font-bold ${isCut ? "text-[#C1442B]" : "text-[#0E8074]"}`}>{a.action}</span>
                      {isNewCandidate ? (
                        <span className="text-[#8792A6]">
                          {" "}
                          · 신규 매체 · 라이브러리 평균 VTR {fmt(lib?.vtr ?? 0)}% · CTR {fmt(lib?.ctr ?? 0)}% 기준 추정
                        </span>
                      ) : (
                        lib && (
                          <span className="text-[#8792A6]">
                            {" "}
                            · 라이브러리 평균 VTR {fmt(lib.vtr)}% (현재 {fmt(cur.vtr)}%) · CTR {fmt(lib.ctr)}% (현재 {fmt(cur.ctr)}%)
                          </span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[11.5px] text-[#8792A6]">
                조정 후 예상 VTR {fmt(bundle.proj.vtr)}% ({bundle.deltaVTR >= 0 ? "+" : ""}
                {fmt(bundle.deltaVTR)}%p) · 예상 CTR {fmt(bundle.proj.ctr)}% ({bundle.deltaCTR >= 0 ? "+" : ""}
                {fmt(bundle.deltaCTR)}%p)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
