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

// 소수점 시간(예: 9.083333...)을 "9시간 5분" 형태로 변환
export function fmtHoursMinutes(hoursDecimal: number): string {
  const totalMinutes = Math.max(0, Math.round(hoursDecimal * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}시간 ${m}분`;
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

// 캠페인 기간(시작일~종료일, 둘 다 포함)의 총 일수. 예: 8/1~8/31 -> 31일
export function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diffDays);
}

// 주어진 행들 중 가장 최근 업로드 시각(uploaded_at)을 찾는다. 그날 실적이 하루 전체가 아니라
// "몇 시까지 업로드된 데이터인지"를 보여주는 용도 (업로드 시점에 따라 실제 커버 범위가 다르기 때문).
export function latestUploadedAt(rows: { uploaded_at: string }[]): string | null {
  let latest: string | null = null;
  for (const r of rows) {
    if (!r.uploaded_at) continue;
    if (!latest || r.uploaded_at > latest) latest = r.uploaded_at;
  }
  return latest;
}

// ISO 타임스탬프를 한국(Asia/Seoul) 기준 "M/D HH:mm"으로 표시
export function formatSeoulDateTime(iso: string): string {
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
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

// 매체 리포트는 엑셀 파일 한 장이 "그날 하루치 실적"이므로(누적치 아님), 오늘 실적은
// 그냥 오늘 날짜로 업로드된 행들을 그대로 모으면 된다 (전날 값을 빼는 등의 보정 불필요).
export function todayRowsOnly(allRows: MediaRow[], today: string): MediaRow[] {
  return allRows.filter((r) => r.report_date === today);
}

// 오늘 업로드된 매체 행들을 실제 라인(예: "데스크탑_2039"와 "데스크탑_5059"는 서로 다르게) 그대로 묶어서,
// 라인별 오늘 실적을 만든다. 캠페인마다 실제 존재하는 라인 구성이 다르므로(예: 연령대별로 세분화된 캠페인)
// 표준 3분류로 합치지 않고 원본 라인명 단위로 보여준다.
export function rowsByLine(rows: { line_label: string; imps: number; view: number; cclick: number; spend: number }[]): LineEstimate[] {
  const groups = new Map<string, { spend: number; imps: number; view: number; cclick: number }>();
  for (const r of rows) {
    const key = r.line_label || "전체";
    const g = groups.get(key) || { spend: 0, imps: 0, view: 0, cclick: 0 };
    g.spend += r.spend;
    g.imps += r.imps;
    g.view += r.view;
    g.cclick += r.cclick;
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

// 아직 이 캠페인에 한 번도 올라온 적 없는 매체를, 매체 라이브러리(다른 캠페인들의 평균 효율)에서 찾아
// "추가하면 이 정도 효율일 것"이라는 가상의 프로필로 만든다. 이 가상 프로필의 spend는 실측치가 아니라
// 같은 라인에서 현재 포함된 매체들의 평균 소진액으로 추정한 값이며, imps/view/cclick은 라이브러리 평균
// VTR·CTR·소진효율을 그 추정 spend에 그대로 적용해서 역산한 값이다 (days: 0으로 표시해 실측과 구분).
function buildAddCandidates(
  profiles: MediaProfile[],
  includedIds: Set<string>,
  libraryProfiles: LibraryProfile[],
  remainingBudget: number,
  bannedMedia: Set<string>
): MediaProfile[] {
  const existingKeys = new Set(profiles.map((p) => `${p.media}__${canonicalLine(p.line)}`));
  const activeLines = new Set(profiles.map((p) => canonicalLine(p.line)));

  const candidates: MediaProfile[] = [];
  for (const lp of libraryProfiles) {
    if (bannedMedia.has(lp.media)) continue; // 이 캠페인에서 노출 금지된 매체는 추가 후보에서 아예 제외
    if (!activeLines.has(lp.line)) continue;
    if (lp.imps <= 0 || lp.spend <= 0) continue;
    const key = `${lp.media}__${lp.line}`;
    if (existingKeys.has(key)) continue; // 이미 이 캠페인에 올라와 있는 매체는 (제외 상태여도) 기존 로직이 커버함

    const sameLinePool = profiles.filter((p) => includedIds.has(p.id) && canonicalLine(p.line) === lp.line && p.spend > 0);
    const anyPool = sameLinePool.length ? sameLinePool : profiles.filter((p) => includedIds.has(p.id) && p.spend > 0);
    const estSpend = anyPool.length
      ? anyPool.reduce((s, p) => s + p.spend, 0) / anyPool.length
      : Math.max(1, remainingBudget * 0.05);
    if (estSpend <= 0) continue;

    const estImps = estSpend * (lp.imps / lp.spend);
    candidates.push({
      id: `cand__${lp.id}`,
      latestRowId: "",
      media: lp.media,
      line: lp.line,
      days: 0, // 실측 0일 = 아직 집행 이력이 없는 라이브러리 기반 추정 후보라는 표시
      imps: estImps,
      view: estImps * (lp.imps > 0 ? lp.view / lp.imps : 0),
      cclick: estImps * (lp.imps > 0 ? lp.cclick / lp.imps : 0),
      spend: estSpend,
      included: false,
    });
  }
  return candidates;
}

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
// 기존에 올라와 있는 매체를 껐다 켰다(제외/재추가)하는 것뿐 아니라, 아직 이 캠페인에 없는 매체도
// 라이브러리 평균 효율을 근거로 "추가" 후보에 포함시킨다.
// 1순위는 가장 효과적인 조합, 2순위 이후는 1순위의 첫 조치를 배제하고 다시 찾은 대안 조합이다.
export function buildRecommendations(
  profiles: MediaProfile[],
  includedIds: Set<string>,
  today: Stats,
  remainingBudget: number,
  currentProjection: Stats,
  vtrRange: Range,
  ctrRange: Range,
  libraryProfiles: LibraryProfile[] = [],
  bannedMedia: Set<string> = new Set()
): RecommendationBundle[] {
  const gapVTR = rangeGap(currentProjection.vtr, vtrRange);
  const gapCTR = rangeGap(currentProjection.ctr, ctrRange);
  if (gapVTR === 0 && gapCTR === 0) return [];

  const addCandidates = buildAddCandidates(profiles, includedIds, libraryProfiles, remainingBudget, bannedMedia);
  const allProfiles = [...profiles, ...addCandidates];
  const eligible = allProfiles.filter((m) => !(m.spend === 0 && m.imps === 0));
  const bundleKey = (b: RecommendationBundle) =>
    [...b.actions.map((a) => a.profile.id)].sort().join(",");

  const bundles: RecommendationBundle[] = [];
  const seenKeys = new Set<string>();
  const forbiddenFirstIds = new Set<string>();

  while (bundles.length < MAX_BUNDLES) {
    const bundle = buildGreedyBundle(
      allProfiles,
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
}
