"use client";

import { Files } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { btn, btnPrimary, input, panel } from "./ui";

const ACCENT = "#2563EB";
const SKIP = "";

interface BatchUploadModalProps {
  files: File[];
  assignments: string[];
  lineOptions: string[]; // "전체" 제외한 실제 라인 목록
  onChangeAssignment: (index: number, line: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BatchUploadModal({ files, assignments, lineOptions, onChangeAssignment, onConfirm, onCancel }: BatchUploadModalProps) {
  // 브라우저가 파일 선택 순서를 보장해주지 않아서, 같은 라인이 중복 지정되면 헷갈리기 쉽다 - 미리 표시해준다
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
      <div className="text-[11.5px] text-[#8792A6] -mt-2 mb-3">
        브라우저 파일 선택 창은 클릭한 순서를 그대로 보장해주지 않아요. 파일마다 어느 라인인지 직접 확인하고 필요하면 바꿔주세요.
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        {files.map((f, i) => {
          const isDup = assignments[i] && (usedCounts.get(assignments[i]) || 0) > 1;
          return (
            <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-md border ${isDup ? "border-[#E7C9C2] bg-[#FBEAE6]" : "border-[#E1E5EC] bg-white"}`}>
              <span className="text-[12.5px] text-[#334155] truncate flex-1" title={f.name}>
                {f.name}
              </span>
              <select
                value={assignments[i] ?? SKIP}
                onChange={(e) => onChangeAssignment(i, e.target.value)}
                className={`${input} w-44 shrink-0`}
              >
                <option value={SKIP}>(건너뛰기)</option>
                {lineOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
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
