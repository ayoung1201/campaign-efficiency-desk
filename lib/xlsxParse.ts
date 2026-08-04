import * as XLSX from "xlsx";

// 다윈에서 받은 매체 리포트 / 시간별 리포트는 헤더 행 위치가 서로 달라서
// '매체' 또는 '시간' + 'Imps' 컬럼이 같이 있는 행을 헤더로 자동 탐지한다.

function normalize(s: unknown): string {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

// "(비과금포함)" 컬럼(예: "View(비과금포함)")은 플랫폼이 실제 VTR·CTR을 계산할 때 쓰는 전체 카운트다
// (과금 제외분까지 포함한 진짜 실적치). "View"/"C.Click" 같은 순수 컬럼은 과금 대상만 집계한 별도 수치라
// 플랫폼이 보여주는 VTR·CTR과 어긋난다. 그래서 preferKeywords로 "(비과금포함)" 변형을 우선 찾는다.
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

function rowsFromStandardTable(table: unknown[][]): ParsedRow[] | null {
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

interface RawHourCols {
  date: number;
  media: number;
  imps: number;
  view: number;
  click: number;
  spend: number;
}

// "시간대별" 원본 로그(날짜×시간×광고슬롯 단위로 쪼개진 raw 리포트, 예: Media_Raw_Hour_Report)를 인식한다.
// 미디어명·총광고비 컬럼이 있는 헤더를 찾아서, 파일에 있는 가장 최근 날짜의 행만 모아 미디어명 기준으로 합산한다.
function findRawHourHeaderAndCols(table: unknown[][]): { headerRow: number; idx: RawHourCols } | null {
  for (let r = 0; r < Math.min(6, table.length); r++) {
    const headers = (table[r] || []).map((c) => String(c ?? ""));
    const mediaIdx = findColIndex(headers, ["미디어명"]);
    const spendIdx = findColIndex(headers, ["총광고비"]);
    const dateIdx = findColIndex(headers, ["날짜"]);
    const impsIdx = findColIndex(headers, ["imp"]);
    if (mediaIdx === -1 || spendIdx === -1 || dateIdx === -1 || impsIdx === -1) continue;
    const viewIdx = findColIndex(headers, ["view"], ["비과금포함"]);
    const clickIdx = findColIndex(headers, ["click"]);
    return { headerRow: r, idx: { date: dateIdx, media: mediaIdx, imps: impsIdx, view: viewIdx, click: clickIdx, spend: spendIdx } };
  }
  return null;
}

// 파일에 여러 날짜가 섞여 있을 때(예: 어제 전체 + 오늘 진행분) 어느 날짜를 쓸지 고른다.
// 오늘(Asia/Seoul) 날짜가 있으면 그 날짜만 쓰고, 없으면(아직 오늘 데이터가 안 채워졌으면) 그 이전 날짜를 쓴다.
function pickTargetDate(dates: Set<string>): string | null {
  if (dates.size === 0) return null;
  const today = todaySeoulDate();
  if (dates.has(today)) return today;
  const past = [...dates].filter((d) => d < today).sort();
  if (past.length > 0) return past[past.length - 1];
  return [...dates].sort()[dates.size - 1]; // 극단적 예외: 전부 미래 날짜뿐이면 그중 가장 최근 것
}

function rowsFromRawHourTable(table: unknown[][]): ParsedRow[] | null {
  const found = findRawHourHeaderAndCols(table);
  if (!found) return null;
  const { headerRow, idx } = found;

  const dates = new Set<string>();
  for (let r = headerRow + 1; r < table.length; r++) {
    const d = String(table[r]?.[idx.date] ?? "").trim();
    if (d) dates.add(d);
  }
  const targetDate = pickTargetDate(dates);
  if (!targetDate) return null;

  const totals = new Map<string, { imps: number; view: number; cclick: number; spend: number }>();
  for (let r = headerRow + 1; r < table.length; r++) {
    const row = table[r];
    if (!row) continue;
    if (String(row[idx.date] ?? "").trim() !== targetDate) continue;
    const media = String(row[idx.media] ?? "").trim();
    if (!media) continue;
    const g = totals.get(media) || { imps: 0, view: 0, cclick: 0, spend: 0 };
    g.imps += toNum(row[idx.imps]);
    g.view += idx.view !== -1 ? toNum(row[idx.view]) : 0;
    g.cclick += idx.click !== -1 ? toNum(row[idx.click]) : 0;
    g.spend += toNum(row[idx.spend]);
    totals.set(media, g);
  }
  const rows: ParsedRow[] = [...totals.entries()].map(([label, g]) => ({ label, ...g }));
  return rows.length ? rows : null;
}

export function rowsFromTable(table: unknown[][]): ParsedRow[] | null {
  return rowsFromStandardTable(table) ?? rowsFromRawHourTable(table);
}

// 브라우저 File 객체를 읽어서 파싱까지 끝낸 결과를 Promise로 반환
export function parseExcelFile(file: File): Promise<ParsedRow[] | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const table = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
        resolve(rowsFromTable(table));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsArrayBuffer(file);
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
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const table = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
        const rows = masterRowsFromTable(table);
        resolve(rows ? { date: todaySeoulDate(), rows } : null);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsArrayBuffer(file);
  });
}
