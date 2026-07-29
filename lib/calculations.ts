import { HourlyRow, LibraryProfile, MediaLibraryRow, MediaProfile, MediaRow, Stats } from "./types";

export function sumRows(rows: { imps: number; view: number; cclick: number; spend: number }[]): Stats {
  const imps = rows.reduce((s, r) => s + r.imps, 0);
  const view = rows.reduce((s, r) => s + r.view, 0);
  const cclick = rows.reduce((s, r) => s + r.cclick, 0);
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  return { imps, view, cclick, spend, vtr: imps ? (view / imps) * 100 : 0, ctr: imps ? (cclick / imps) * 100 : 0 };
}

export function fmt(n: number | null | undefined, d = 1): string {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: d, minimumFractionDigits: d });
}

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return Math.round(n).toLocaleString("ko-KR");
}

export function todaySoFar(hourlyRows: HourlyRow[]): Stats {
  return sumRows(hourlyRows);
}

export function elapsedHours(hourlyRows: HourlyRow[]): number {
  let last = -1;
  hourlyRows.forEach((r, i) => {
    if (r.imps > 0) last = i;
  });
  return last + 1;
}

// 캠페인마다 라인 이름이 제각각이라(예: "데스크탑_2039" vs "데스크탑"), 이름에 포함된
// 키워드로 데스크탑/모바일app/모바일web 3가지 표준 카테고리로 묶는다.
// 매체 라이브러리(여러 캠페인 비교)와 매체 테이블 그룹핑에 공통으로 사용.
export function canonicalLine(line: string): string {
  const l = (line || "").toLowerCase();
  if (l.includes("모바일app") || l.includes("mobile app") || l.includes("app")) return "모바일app";
  if (l.includes("모바일web") || l.includes("mobile web") || l.includes("web")) return "모바일web";
  if (l.includes("데스크탑") || l.includes("데스크톱") || l.includes("desktop") || l.includes("pc")) return "데스크탑";
  return line || "전체";
}

export function buildMediaProfiles(allRows: MediaRow[]): MediaProfile[] {
  const groups = new Map<string, MediaRow[]>();
  for (const r of allRows) {
    const key = `${r.media}__${r.line_label || "전체"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const profiles: MediaProfile[] = [];
  for (const [key, rows] of groups) {
    const sorted = [...rows].sort((a, b) => (a.report_date < b.report_date ? 1 : -1));
    const latest = sorted[0];
    const distinctDates = new Set(rows.map((r) => r.report_date));
    profiles.push({
      id: key,
      latestRowId: latest.id,
      media: latest.media,
      line: latest.line_label || "전체",
      days: distinctDates.size,
      imps: rows.reduce((s, r) => s + r.imps, 0),
      view: rows.reduce((s, r) => s + r.view, 0),
      cclick: rows.reduce((s, r) => s + r.cclick, 0),
      spend: rows.reduce((s, r) => s + r.spend, 0),
      included: latest.included,
    });
  }
  return profiles;
}

// 여러 과거 캠페인에서 모인 매체 라이브러리 데이터를, 표준 라인 카테고리(canonicalLine) 기준으로 묶는다
export function buildLibraryProfiles(rows: MediaLibraryRow[]): LibraryProfile[] {
  const groups = new Map<string, MediaLibraryRow[]>();
  for (const r of rows) {
    const key = `${r.media}__${canonicalLine(r.line_label)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const profiles: LibraryProfile[] = [];
  for (const [key, group] of groups) {
    const sources = new Set(group.map((r) => r.source || "미상"));
    profiles.push({
      id: key,
      media: group[0].media,
      line: canonicalLine(group[0].line_label),
      campaignCount: sources.size,
      imps: group.reduce((s, r) => s + r.imps, 0),
      view: group.reduce((s, r) => s + r.view, 0),
      cclick: group.reduce((s, r) => s + r.cclick, 0),
      spend: group.reduce((s, r) => s + r.spend, 0),
    });
  }
  return profiles;
}

export function profileMetrics(p: { imps: number; view: number; cclick: number }) {
  return { vtr: p.imps ? (p.view / p.imps) * 100 : 0, ctr: p.imps ? (p.cclick / p.imps) * 100 : 0 };
}

export function projectRemaining(profiles: MediaProfile[], includedIds: Set<string>, remainingBudget: number) {
  const included = profiles.filter((m) => includedIds.has(m.id) && m.spend > 0);
  const totalSpend = included.reduce((s, m) => s + m.spend, 0);
  if (totalSpend <= 0 || remainingBudget <= 0) return { imps: 0, view: 0, cclick: 0 };
  let imps = 0,
    view = 0,
    cclick = 0;
  for (const m of included) {
    const share = m.spend / totalSpend;
    const remSpend = share * remainingBudget;
    const remImps = remSpend * (m.imps / m.spend);
    imps += remImps;
    view += remImps * (m.imps ? m.view / m.imps : 0);
    cclick += remImps * (m.imps ? m.cclick / m.imps : 0);
  }
  return { imps, view, cclick };
}

export function projectFinal(
  today: Stats,
  profiles: MediaProfile[],
  includedIds: Set<string>,
  remainingBudget: number
): Stats {
  const rem = projectRemaining(profiles, includedIds, remainingBudget);
  const imps = today.imps + rem.imps;
  const view = today.view + rem.view;
  const cclick = today.cclick + rem.cclick;
  return {
    imps,
    view,
    cclick,
    spend: today.spend + remainingBudget,
    vtr: imps ? (view / imps) * 100 : 0,
    ctr: imps ? (cclick / imps) * 100 : 0,
  };
}

export interface Range {
  min: number;
  max: number;
}

// value가 [min,max] 안에 있으면 0, 낮으면 (부족한 만큼 양수, 더 올려야 함),
// 높으면 (초과한 만큼 음수, 더 낮춰야 함)
export function rangeGap(value: number, range: Range): number {
  if (value < range.min) return range.min - value;
  if (value > range.max) return range.max - value;
  return 0;
}

export function inRange(value: number, range: Range): boolean {
  return value >= range.min && value <= range.max;
}

export interface Recommendation {
  profile: MediaProfile;
  action: "제외" | "추가";
  proj: Stats;
  deltaVTR: number;
  deltaCTR: number;
  score: number;
}

export function buildRecommendations(
  profiles: MediaProfile[],
  includedIds: Set<string>,
  today: Stats,
  remainingBudget: number,
  currentProjection: Stats,
  vtrRange: Range,
  ctrRange: Range
): Recommendation[] {
  const gapVTR = rangeGap(currentProjection.vtr, vtrRange);
  const gapCTR = rangeGap(currentProjection.ctr, ctrRange);
  if (gapVTR === 0 && gapCTR === 0) return [];

  const vtrNorm = Math.max(vtrRange.max, 1);
  const ctrNorm = Math.max(ctrRange.max, 0.01);

  const results: Recommendation[] = [];
  for (const m of profiles) {
    if (m.spend === 0 && m.imps === 0) continue;
    const flipped = new Set(includedIds);
    const wasIncluded = flipped.has(m.id);
    if (wasIncluded) flipped.delete(m.id);
    else flipped.add(m.id);

    const proj = projectFinal(today, profiles, flipped, remainingBudget);
    const deltaVTR = proj.vtr - currentProjection.vtr;
    const deltaCTR = proj.ctr - currentProjection.ctr;

    let score = 0;
    // gap이 양수(부족)면 delta가 오르는 쪽이 좋고, gap이 음수(초과)면 delta가 내려가는 쪽이 좋다
    if (gapVTR !== 0) score += (gapVTR > 0 ? deltaVTR : -deltaVTR) / vtrNorm;
    if (gapCTR !== 0) score += (gapCTR > 0 ? deltaCTR : -deltaCTR) / ctrNorm;

    if (score > 0.001) {
      results.push({ profile: m, action: wasIncluded ? "제외" : "추가", proj, deltaVTR, deltaCTR, score });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}

export interface LineEstimate {
  line: string;
  spend: number;
  imps: number;
  view: number;
  cclick: number;
  vtr: number;
  ctr: number;
}

export function estimateTodayByLine(profiles: MediaProfile[], todaySpend: number): LineEstimate[] {
  const lineGroups = new Map<string, { spend: number; imps: number; view: number; cclick: number }>();
  for (const p of profiles) {
    const key = canonicalLine(p.line);
    const g = lineGroups.get(key) || { spend: 0, imps: 0, view: 0, cclick: 0 };
    g.spend += p.spend;
    g.imps += p.imps;
    g.view += p.view;
    g.cclick += p.cclick;
    lineGroups.set(key, g);
  }
  const totalSpend = [...lineGroups.values()].reduce((s, g) => s + g.spend, 0);
  if (totalSpend <= 0) return [];
  const results: LineEstimate[] = [];
  for (const [line, g] of lineGroups) {
    const share = g.spend / totalSpend;
    const estSpend = share * todaySpend;
    const estImps = g.spend > 0 ? estSpend * (g.imps / g.spend) : 0;
    const estView = g.imps > 0 ? estImps * (g.view / g.imps) : 0;
    const estClick = g.imps > 0 ? estImps * (g.cclick / g.imps) : 0;
    results.push({
      line,
      spend: estSpend,
      imps: estImps,
      view: estView,
      cclick: estClick,
      vtr: estImps ? (estView / estImps) * 100 : 0,
      ctr: estImps ? (estClick / estImps) * 100 : 0,
    });
  }
  return results.sort((a, b) => b.spend - a.spend);
}
