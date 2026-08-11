"use client";

import { useState } from "react";
import { Files } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { btn, btnPrimary, input, panel } from "./ui";

const ACCENT = "#2563EB";
const SKIP = "";
const CUSTOM = "__custom__";

interface BatchUploadModalProps {
  files: File[];
  assignments: string[];
  lineOptions: string[]; // "전체" 제외한 실제 라인 목록
  onChangeAssignment: (index: number, line: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  allowCustom?: boolean; // 목록에 없는 라인명을 파일별로 직접 입력할 수 있게 할지 (예: 자이스처럼 라인이 세분화된 캠페인)
}

export default function BatchUploadModal({ files, assignments, lineOptions, onChangeAssignment, onConfirm, onCancel, allowCustom = false }: BatchUploadModalProps) {
  // 목록에 없는 라인명을 직접 입력 중인 행 번호들
  const [customRows, setCustomRows] = useState<Set<number>>(new Set());

  const usedCounts = new Map<string, number>();
  for (const a of assignments) {
    if (!a) continue;
    usedCounts.set(a, (usedCounts.get(a) || 0) + 1);
  }
  const hasDuplicate = [...usedCounts.values()].some((n) => n > 1);

  return (
    <div className={`${panel} p-4 mb-4`}>
      <SectionTitle icon={Files} color={ACCENT}>
        여러 파일 라인 매칭 확인
      </SectionTitle>

      <div className="flex flex-col gap-1.5 mb-3">
        {files.map((f, i) => {
          const isDup = assignments[i] && (usedCounts.get(assignments[i]) || 0) > 1;
          const isCustom = customRows.has(i);
          return (
            <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-md border ${isDup ? "border-[#E7C9C2] bg-[#FBEAE6]" : "border-[#E1E5EC] bg-white"}`}>
              <span className="text-[12.5px] text-[#334155] truncate flex-1" title={f.name}>
                {f.name}
              </span>
              {isCustom ? (
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="text"
                    value={assignments[i] ?? ""}
                    onChange={(e) => onChangeAssignment(i, e.target.value)}
                    placeholder="라인명 직접 입력"
                    autoFocus
                    className={`${input} w-40`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomRows((prev) => {
                        const next = new Set(prev);
                        next.delete(i);
                        return next;
                      });
                      onChangeAssignment(i, SKIP);
                    }}
                    className="text-[#9AA4B5] hover:text-[#0B1220] text-xs px-1"
                    title="목록에서 선택하기로 전환"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={assignments[i] ?? SKIP}
                  onChange={(e) => {
                    if (e.target.value === CUSTOM) {
                      setCustomRows((prev) => new Set(prev).add(i));
                      onChangeAssignment(i, "");
                    } else {
                      onChangeAssignment(i, e.target.value);
                    }
                  }}
                  className={`${input} w-44 shrink-0`}
                >
                  <option value={SKIP}>(건너뛰기)</option>
                  {lineOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                  {allowCustom && <option value={CUSTOM}>+ 새 라인명 직접 입력</option>}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {hasDuplicate && (
        <div className="text-[12px] text-[#C1442B] mb-3">같은 라인이 두 번 이상 지정됐어요(빨간 표시). 나중 파일이 먼저 파일을 덮어쓰니 확인해주세요.</div>
      )}

      <div className="flex gap-2">
        <button onClick={onConfirm} className={btnPrimary}>
          이대로 업로드
        </button>
        <button onClick={onCancel} className={btn}>
          취소
        </button>
      </div>
    </div>
  );
}
