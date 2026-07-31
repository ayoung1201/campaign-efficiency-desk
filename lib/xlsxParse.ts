import * as XLSX from "xlsx";

// 다윈에서 받은 매체 리포트 / 시간별 리포트는 헤더 행 위치가 서로 달라서
// '매체' 또는 '시간' + 'Imps' 컬럼이 같이 있는 행을 헤더로 자동 탐지한다.

function normalize(s: unknown): string {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function findColIndex(headers: string[], keywords: string[], preferKeywords?: string[]): number {
  const norm = headers.map(normalize);
  if (preferKeywords) {
    for (const k of keywords) {
      for (const p of preferKeywords) {
        const idx = norm.findIndex((h) => h.includes(normalize(k)) && h.includes(normalize(p)));
        if (idx !== -1) return idx;
      }
    }
  }
  for (const k of keywords) {
    const idx = norm.findIndex((h) => h.includes(normalize(k)) && !h.includes(normalize("비과금포함")));
    if (idx !== -1) return idx;
  }
  for (const k of keywords) {
    const idx = norm.findIndex((h) => h.includes(normalize(k)));
    if (idx !== -1) return idx;
  }
  return -1;
}

export interface ParsedRow {
  label: string;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
}

function findHeaderRowAndCols(table: unknown[][]) {
  for (let r = 0; r < Math.min(6, table.length); r++) {
    const headers = (table[r] || []).map((c) => String(c ?? ""));
    const labelIdx = findColIndex(headers, ["매체", "media", "시간"]);
    const impsIdx = findColIndex(headers, ["imps"]);
    if (labelIdx !== -1 && impsIdx !== -1) {
      const viewIdx = findColIndex(headers, ["view"], ["비과금포함"]);
      const cclickIdx = findColIndex(headers, ["c.click", "cclick"], ["비과금포함"]);
      const spendIdx = findColIndex(headers, ["소진광고비", "소진 광고비", "소진"]);
      return { headerRow: r, idx: { label: labelIdx, imps: impsIdx, view: viewIdx, cclick: cclickIdx, spend: spendIdx } };
    }
  }
  return null;
}

function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? "0").replace(/,/g, "").replace("%", ""));
  return isNaN(n) ? 0 : n;
}

export function rowsFromTable(table: unknown[][]): ParsedRow[] | null {
  const found = findHeaderRowAndCols(table);
  if (!found) return null;
  const { headerRow, idx } = found;
  const rows: ParsedRow[] = [];
  for (let r = headerRow + 1; r < table.length; r++) {
    const row = table[r];
    if (!row || row.every((c) => c === undefined || c === "")) continue;
    const label = String(row[idx.label] ?? "").trim();
    if (!label || label === "합계" || label === "매체") continue;
    rows.push({
      label,
      imps: toNum(row[idx.imps]),
      view: idx.view !== -1 ? toNum(row[idx.view]) : 0,
      cclick: idx.cclick !== -1 ? toNum(row[idx.cclick]) : 0,
      spend: idx.spend !== -1 ? toNum(row[idx.spend]) : 0,
    });
  }
  return rows.length ? rows : null;
}

// 브라우저 File 객체를 읽어서 파싱까지 끝낸 결과를 Promise로 반환
export function parseExcelFile(file: File): Promise<ParsedRow[] | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const table = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
        resolve(rowsFromTable(table));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsBinaryString(file);
  });
}

export interface ParsedMasterRow {
  media: string;
  line: string;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
}

export interface ParsedMaster {
  date: string; // 업로드 시점(Asia/Seoul) 기준 오늘 날짜 - 매체 라이브러리는 이 값으로 같은 날 재업로드를 덮어쓴다
  rows: ParsedMasterRow[];
}

// 매체 라이브러리용 마스터 리포트는 미디어명/채널(라인)이 한 행에 같이 있어서, 두 컬럼을 모두 찾아야 한다.
function findMasterHeaderRowAndCols(table: unknown[][]) {
  for (let r = 0; r < Math.min(6, table.length); r++) {
    const headers = (table[r] || []).map((c) => String(c ?? ""));
    const mediaIdx = findColIndex(headers, ["미디어명", "매체명", "매체", "media"]);
    const lineIdx = findColIndex(headers, ["채널", "라인", "line"]);
    const impsIdx = findColIndex(headers, ["imps", "imp"]);
    if (mediaIdx !== -1 && lineIdx !== -1 && impsIdx !== -1) {
      const viewIdx = findColIndex(headers, ["view"], ["비과금포함"]);
      const cclickIdx = findColIndex(headers, ["c.click", "cclick", "click"], ["비과금포함"]);
      const spendIdx = findColIndex(headers, ["소진광고비", "소진 광고비", "소진"]);
      return { headerRow: r, idx: { media: mediaIdx, line: lineIdx, imps: impsIdx, view: viewIdx, cclick: cclickIdx, spend: spendIdx } };
    }
  }
  return null;
}

function masterRowsFromTable(table: unknown[][]): ParsedMasterRow[] | null {
  const found = findMasterHeaderRowAndCols(table);
  if (!found) return null;
  const { headerRow, idx } = found;
  const rows: ParsedMasterRow[] = [];
  for (let r = headerRow + 1; r < table.length; r++) {
    const row = table[r];
    if (!row || row.every((c) => c === undefined || c === "")) continue;
    const media = String(row[idx.media] ?? "").trim();
    const line = String(row[idx.line] ?? "").trim();
    if (!media || media === "합계") continue;
    rows.push({
      media,
      line,
      imps: toNum(row[idx.imps]),
      view: idx.view !== -1 ? toNum(row[idx.view]) : 0,
      cclick: idx.cclick !== -1 ? toNum(row[idx.cclick]) : 0,
      spend: idx.spend !== -1 ? toNum(row[idx.spend]) : 0,
    });
  }
  return rows.length ? rows : null;
}

// 한국(Asia/Seoul) 달력 기준 오늘 날짜 - 매체 라이브러리는 이 날짜로 같은 날 재업로드를 덮어쓴다
function todaySeoulDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

// 매체 라이브러리(여러 캠페인 비교)용 마스터 엑셀 파일을 읽어서 파싱까지 끝낸 결과를 Promise로 반환
export function parseMasterExcelFile(file: File): Promise<ParsedMaster | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const table = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
        const rows = masterRowsFromTable(table);
        resolve(rows ? { date: todaySeoulDate(), rows } : null);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsBinaryString(file);
  });
}
