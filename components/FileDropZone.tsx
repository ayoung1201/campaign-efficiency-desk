"use client";

import { DragEvent, ReactNode, useRef, useState } from "react";

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: ReactNode;
  className?: string;
}

// 엑셀 파일을 이 영역 어디에든 드래그해서 놓으면 파일 선택창을 거치지 않고 바로 업로드 흐름으로 넘어간다.
// dragCounter로 세는 이유: 자식 요소를 넘나들 때마다 dragenter/dragleave가 반복 발생해서, 단순 boolean으로
// 처리하면 자식 경계를 지날 때 깜빡인다.
export default function FileDropZone({ onFilesDropped, children, className = "" }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
    if (files.length > 0) onFilesDropped(files);
  };

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[#0B1220] bg-[#0B1220]/[0.04] pointer-events-none">
          <span className="text-[13px] font-semibold text-[#0B1220] bg-white px-3 py-1.5 rounded-md shadow-md">여기에 엑셀 파일을 놓으세요</span>
        </div>
      )}
    </div>
  );
}
