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
