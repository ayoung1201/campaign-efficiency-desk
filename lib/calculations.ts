import { HourlyRow, LibraryProfile, MediaLibraryRow, MediaProfile, MediaRow, Stats } from "./types";

export function sumRows(rows: { imps: number; view: number; cclick: number; spend: number }[]): Stats {
  const imps = rows.reduce((s, r) => s + r.imps, 0);
  const view = rows.reduce((s, r) => s + r.view, 0);
  const cclick = rows.reduce((s, r) => s + r.cclick, 0);
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  return { imps, view, cclick, spend, vtr: imps ? (view / imps) * 100 : 0, ctr: imps ? (cclick / imps) * 100 : 0 };
}

export function fmt(n: number | null | undefined, d = 2): string {
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

// 한국(Asia/Seoul) 달력 기준 오늘 날짜 (YYYY-MM-DD)
export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

// 한국(Asia/Seoul) 기준 지금 몇시(소수점 포함, 예: 14시 30분 -> 14.5)
export function currentSeoulHourFraction(): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(
    new Date()
  );
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour + minute / 60;
}

export interface MediaDelta {
  media: string;
  line: string;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
  isFirstSnapshot: boolean; // 이 매체+라인이 오늘 처음 새로된 경우 (이전 대비 증분을 못 구한 경우, 누적 치 전체가 그대로 오늘 값으로 잡힘)
}

// 매체 리포트는 "캠페인 시작부터 지금까지의 누적 치"이므로, 오늘의 실제 실적은
// 오늘 스냅샷에서 가장 최근 이전 날짜 스냅샷을 빼서 구한다 (일별 델타).
// 이렇게 하면 별도의 시간별 리포트 업로드 없이도 오늘 실적을 정확히 계산할 수 있다.
export function computeMediaDeltasToday(allRows: MediaRow[], today: string): MediaDelta[] {
  const groups = new Map<string, MediaRow[]>();
  for (const r of allRows) {
    const key = `${r.media}__${r.line_label || "전체"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const deltas: MediaDelta[] = [];
  for (const rows of groups.values()) {
    const sorted = [...rows].sort((a, b) => (a.report_date < b.report_date ? 1 : -1)); // 최신순
    const latest = sorted[0];
    if (latest.report_date !== today) continue; // 오늘 업데이트가 없는 매체는 오늘 실적 0으로 취급
    const prev = sorted[1];
    deltas.push({
      media: latest.media,
      line: latest.line_label || "전체",
      imps: Math.max(0, latest.imps - (prev?.imps ?? 0)),
      view: Math.max(0, latest.view - (prev?.view ?? 0)),
      cclick: Math.max(0, latest.cclick - (prev?.cclick ?? 0)),
      spend: Math.max(0, latest.spend - (prev?.spend ?? 0)),
      isFirstSnapshot: !prev,
    });
  }
  return deltas;
}

export function sumDeltas(deltas: MediaDelta[]): Stats {
  return sumRows(deltas);
}

// 델타치를 표준 라인 카테고리(데스크탑/모바일app/모바일web)로 묶어서, 오늘 실적 라인별 성과를 만든다 (추정 수치)
export function deltasByLine(deltas: MediaDelta[]): LineEstimate[] {
  const groups = new Map<string, { spend: number; imps: number; view: number; cclick: number }>();
  for (const d of deltas) {
    const key = canonicalLine(d.line);
    const g = groups.get(key) || { spend: 0, imps: 0, view: 0, cclick: 0 };
    g.spend += d.spend;
    g.imps += d.imps;
    g.view += d.view;
    g.cclick += d.cclick;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([line, g]) => ({
      line,
      spend: g.spend,
      imps: g.imps,
      view: g.view,
      cclick: g.cclick,
      vtr: g.imps ? (g.view / g.imps) * 100 : 0,
      ctr: g.imps ? (g.cclick / g.imps) * 100 : 0,
      maxDays: 1,
    }))
    .sort((a, b) => b.spend - a.spend);
}

// 캠페인마다 라인 이름이 제각각이라(예: "데스크탑_2039" vs "데스크탑"), 이름에 포함된
// 키워드로 데스크탑/모바일app/모바일web 3가지 표준 카테고리로 묶는다.
// 매체 라이브러리(여러 캠페인 비교)와 매체 테이블 그룹핑에 공통으로 사용.
export function canonicalLine(line: string): string {
  const l = (line || "").toLowerCase();
  if (l.includes("모바일app") || l.includes("mobile app") || l.includes("모바일앱") || l.includes("app")) return "모바일app";
  if (l.includes("모바일web") || l.includes("mobile web") || l.includes("모바일웹") || (l.includes("웹") && !l.includes("데스크")) || l.includes("web")) return "모바일web";
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

export interface RecommendationAction {
  profile: MediaProfile;
  action: "제외" | "추가";
}

export interface RecommendationBundle {
  rank: number;
  actions: RecommendationAction[];
  proj: Stats;
  deltaVTR: number;
  deltaCTR: number;
}

const MAX_BUNDLE_STEPS = 5; // 한 조합에 담을 최대 조치 개수 (너무 길면 실행하기 부담스러우므로 제한)
const MAX_BUNDLES = 3; // 1순위~3순위까지만 제시

// 목표 범위에 가장 빠르게 도달하는 매체 조합을 그리디하게 찾는다.
// 매 단계마다 "지금 남은 gap을 가장 많이 줄이는 단일 조치"를 골라 조합에 추가하고,
// 목표 범위 안에 들어오거나 더 이상 도움이 되는 조치가 없으면 멈춘다.
function buildGreedyBundle(
  profiles: MediaProfile[],
  includedIds: Set<string>,
  today: Stats,
  remainingBudget: number,
  currentProjection: Stats,
  vtrRange: Range,
  ctrRange: Range,
  eligible: MediaProfile[],
  forbiddenFirstIds: Set<string>
): RecommendationBundle | null {
  const vtrNorm = Math.max(vtrRange.max, 1);
  const ctrNorm = Math.max(ctrRange.max, 0.01);

  let included = new Set(includedIds);
  let proj = currentProjection;
  const actions: RecommendationAction[] = [];
  const used = new Set<string>();

  for (let step = 0; step < MAX_BUNDLE_STEPS; step++) {
    const gapVTR = rangeGap(proj.vtr, vtrRange);
    const gapCTR = rangeGap(proj.ctr, ctrRange);
    if (gapVTR === 0 && gapCTR === 0) break;

    let best: { profile: MediaProfile; score: number; proj: Stats; wasIncluded: boolean } | null = null;
    for (const m of eligible) {
      if (used.has(m.id)) continue;
      if (step === 0 && forbiddenFirstIds.has(m.id)) continue;
      const flipped = new Set(included);
      const wasIncluded = flipped.has(m.id);
      if (wasIncluded) flipped.delete(m.id);
      else flipped.add(m.id);

      const candProj = projectFinal(today, profiles, flipped, remainingBudget);
      const deltaVTR = candProj.vtr - proj.vtr;
      const deltaCTR = candProj.ctr - proj.ctr;

      let score = 0;
      if (gapVTR !== 0) score += (gapVTR > 0 ? deltaVTR : -deltaVTR) / vtrNorm;
      if (gapCTR !== 0) score += (gapCTR > 0 ? deltaCTR : -deltaCTR) / ctrNorm;

      if (!best || score > best.score) best = { profile: m, score, proj: candProj, wasIncluded };
    }

    if (!best || best.score <= 0.001) break;
    const flipped = new Set(included);
    if (best.wasIncluded) flipped.delete(best.profile.id);
    else flipped.add(best.profile.id);
    included = flipped;
    used.add(best.profile.id);
    actions.push({ profile: best.profile, action: best.wasIncluded ? "제외" : "추가" });
    proj = best.proj;
  }

  if (actions.length === 0) return null;
  return { rank: 0, actions, proj, deltaVTR: proj.vtr - currentProjection.vtr, deltaCTR: proj.ctr - currentProjection.ctr };
}

// 매체를 하나씩 따로 추천하는 대신, 목표 범위 도달까지 함께 조정할 매체 "조합"을 1순위/2순위 순으로 제시한다.
// 1순위는 가장 효과적인 조합, 2순위 이후는 1순위의 첫 조치를 배제하고 다시 찾은 대안 조합이다.
export function buildRecommendations(
  profiles: MediaProfile[],
  includedIds: Set<string>,
  today: Stats,
  remainingBudget: number,
  currentProjection: Stats,
  vtrRange: Range,
  ctrRange: Range
): RecommendationBundle[] {
  const gapVTR = rangeGap(currentProjection.vtr, vtrRange);
  const gapCTR = rangeGap(currentProjection.ctr, ctrRange);
  if (gapVTR === 0 && gapCTR === 0) return [];

  const eligible = profiles.filter((m) => !(m.spend === 0 && m.imps === 0));
  const bundleKey = (b: RecommendationBundle) =>
    [...b.actions.map((a) => a.profile.id)].sort().join(",");

  const bundles: RecommendationBundle[] = [];
  const seenKeys = new Set<string>();
  const forbiddenFirstIds = new Set<string>();

  while (bundles.length < MAX_BUNDLES) {
    const bundle = buildGreedyBundle(
      profiles,
      includedIds,
      today,
      remainingBudget,
      currentProjection,
      vtrRange,
      ctrRange,
      eligible,
      forbiddenFirstIds
    );
    if (!bundle) break;
    const key = bundleKey(bundle);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      bundles.push(bundle);
    }
    // 다음 대안 조합을 찾기 위해, 이번에 1번째로 골랐던 매체를 다음 탐색에서는 제외한다
    forbiddenFirstIds.add(bundle.actions[0].profile.id);
  }

  return bundles.map((b, i) => ({ ...b, rank: i + 1 }));
}

export interface LineEstimate {
  line: string;
  spend: number;
  imps: number;
  view: number;
  cclick: number;
  vtr: number;
  ctr: number;
  maxDays: number; // 이 라인에 섞여 있는 매체 중 가장 많은 날짜 수 (1보다 크면 여러 날짜가 누적된 평균)
}

export function estimateTodayByLine(profiles: MediaProfile[], todaySpend: number): LineEstimate[] {
  const lineGroups = new Map<string, { spend: number; imps: number; view: number; cclick: number; maxDays: number }>();
  for (const p of profiles) {
    const key = canonicalLine(p.line);
    const g = lineGroups.get(key) || { spend: 0, imps: 0, view: 0, cclick: 0, maxDays: 0 };
    g.spend += p.spend;
    g.imps += p.imps;
    g.view += p.view;
    g.cclick += p.cclick;
    g.maxDays = Math.max(g.maxDays, p.days);
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
      maxDays: g.maxDays,
    });
  }
  return results.sort((a, b) => b.spend - a.spend);
}
