"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Campaign, MediaLibraryRow, MediaRow } from "../lib/types";
import { parseExcelFile, parseMasterExcelFile } from "../lib/xlsxParse";
import {
  buildLibraryProfiles,
  buildMediaProfiles,
  buildRecommendations,
  canonicalLine,
  currentSeoulHourFraction,
  fmt,
  fmtInt,
  inRange,
  profileMetrics,
  projectFinal,
  rowsByLine,
  sumRows,
  todayRowsOnly,
  todayStr,
} from "../lib/calculations";
import Gauge from "../components/Gauge";
import { Upload, SlidersHorizontal, Library, RotateCcw, Trash2, Plus, Files } from "lucide-react";

const CANONICAL_ORDER = ["데스크탑", "모바일app", "모바일web"];
const LIBRARY_LINE_OPTIONS = ["데스크탑", "모바일app", "모바일web"];

// --- 공용 스타일 토큰 ---
const btn =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#D7DCE5] bg-white text-[13px] font-medium text-[#334155] hover:border-[#0B1220] hover:bg-[#F4F6F9] hover:text-[#0B1220] transition-colors";
const btnActive = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#0B1220] bg-[#0B1220] text-[13px] font-medium text-white transition-colors";
const btnPrimary = "px-4 py-2 rounded-md bg-[#0B1220] text-white text-[13px] font-semibold hover:bg-[#182338] transition-colors";
const btnDanger =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E7C9C2] bg-white text-[12.5px] font-semibold text-[#C1442B] hover:bg-[#FBEAE6] transition-colors";
const toolbarGroup = "flex items-center gap-1.5 bg-white border border-[#E1E5EC] rounded-md p-1.5";
const input = "px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220]";
const panel = "bg-white border border-[#E1E5EC] rounded-md";
const panelTitle = "text-[12px] font-semibold uppercase tracking-wide text-[#4A5568]";
const label = "text-[11px] font-semibold uppercase tracking-wide text-[#8792A6]";

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [allMediaRows, setAllMediaRows] = useState<MediaRow[]>([]);

  // 목표는 "최소 이상"이 아니라 적정 범위(min~max)로 관리
  const [targetVTRMin, setTargetVTRMin] = useState(70);
  const [targetVTRMax, setTargetVTRMax] = useState(73);
  const [targetCTRMin, setTargetCTRMin] = useState(1.0);
  const [targetCTRMax, setTargetCTRMax] = useState(1.3);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadLine, setUploadLine] = useState("전체");

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLines, setNewLines] = useState<string[]>(["", "", ""]);

  const [showLineManager, setShowLineManager] = useState(false);
  const [editLines, setEditLines] = useState<string[]>([]);

  const [library, setLibrary] = useState<MediaLibraryRow[]>([]);
  const [showLibraryPanel, setShowLibraryPanel] = useState(false);
  const [libViewLine, setLibViewLine] = useState("전체");

  const mediaFileRef = useRef<HTMLInputElement>(null);
  const batchFileRef = useRef<HTMLInputElement>(null);
  const libraryFileRef = useRef<HTMLInputElement>(null);

  const active = campaigns.find((c) => c.id === activeId) || null;

  // 업로드 대상 라인 목록 - "전체"는 항상 기본으로 포함
  const lineOptions = useMemo(() => {
    const custom = (active?.lines || []).filter((l) => l && l !== "전체");
    return ["전체", ...custom];
  }, [active]);

  const loadCampaigns = async () => {
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: true });
    if (error) {
      setError("캠페인 목록을 불러오지 못했어요: " + error.message);
      return;
    }
    setCampaigns(data || []);
    if (data && data.length > 0 && !activeId) setActiveId(data[0].id);
  };

  const loadCampaignData = async (campaignId: string) => {
    setLoading(true);
    const mediaRes = await supabase.from("media_reports").select("*").eq("campaign_id", campaignId).order("report_date", { ascending: false });
    if (mediaRes.error) setError("매체 데이터를 불러오지 못했어요: " + mediaRes.error.message);
    else setAllMediaRows(mediaRes.data || []);
    setLoading(false);
  };

  const loadLibrary = async () => {
    const { data, error } = await supabase.from("media_library").select("*");
    if (error) setError("매체 라이브러리를 불러오지 못했어요: " + error.message);
    else setLibrary(data || []);
  };

  useEffect(() => {
    loadCampaigns();
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId) loadCampaignData(activeId);
    setUploadLine("전체");
  }, [activeId]);

  const updateNewLine = (i: number, value: string) => setNewLines((prev) => prev.map((l, idx) => (idx === i ? value : l)));
  const addNewLineField = () => setNewLines((prev) => [...prev, ""]);
  const removeNewLineField = (i: number) => setNewLines((prev) => prev.filter((_, idx) => idx !== i));

  const createCampaign = async () => {
    const name = newName.trim();
    if (!name) return;
    const lines = newLines.map((l) => l.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from("campaigns")
      .insert({ name, lines: lines.length > 0 ? lines : ["전체"] })
      .select()
      .single();
    if (error) {
      setError("캠페인 생성 실패: " + error.message);
      return;
    }
    setNewName("");
    setNewLines(["", "", ""]);
    setShowNewForm(false);
    await loadCampaigns();
    if (data) setActiveId(data.id);
  };

  const deleteCampaign = async (c: Campaign) => {
    const ok = window.confirm(`"${c.name}" 캠페인을 삭제할까요?\n이 캠페인에 저장된 매체 리포트 데이터도 함께 삭제되며, 되돌릴 수 없습니다.`);
    if (!ok) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", c.id);
    if (error) {
      setError("캠페인 삭제 실패: " + error.message);
      return;
    }
    const remaining = campaigns.filter((x) => x.id !== c.id);
    setCampaigns(remaining);
    if (activeId === c.id) {
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
      setAllMediaRows([]);
    }
  };

  const resetCampaignData = async (c: Campaign) => {
    const ok = window.confirm(`"${c.name}" 캠페인의 업로드된 매체 리포트 데이터를 전부 초기화할까요?\n캠페인명과 라인 구성은 그대로 유지되고, 되돌릴 수 없습니다.`);
    if (!ok) return;
    // hourly_reports는 더 이상 사용하지 않지만, 과거에 쌓아뒀던 데이터가 남아있으면 함께 정리
    const [mediaRes] = await Promise.all([
      supabase.from("media_reports").delete().eq("campaign_id", c.id),
      supabase.from("hourly_reports").delete().eq("campaign_id", c.id),
    ]);
    if (mediaRes.error) {
      setError("초기화 실패: " + mediaRes.error.message);
      return;
    }
    setAllMediaRows([]);
    setError("");
  };

  const openLineManager = () => {
    if (!active) return;
    setEditLines(active.lines && active.lines.length > 0 ? [...active.lines] : [""]);
    setShowLineManager(true);
  };
  const updateEditLine = (i: number, value: string) => setEditLines((prev) => prev.map((l, idx) => (idx === i ? value : l)));
  const addEditLineField = () => setEditLines((prev) => [...prev, ""]);
  const removeEditLineField = (i: number) => setEditLines((prev) => prev.filter((_, idx) => idx !== i));
  const saveLines = async () => {
    if (!active) return;
    const lines = editLines.map((l) => l.trim()).filter(Boolean);
    const finalLines = lines.length > 0 ? lines : ["전체"];
    const { error } = await supabase.from("campaigns").update({ lines: finalLines }).eq("id", active.id);
    if (error) {
      setError("라인 저장 실패: " + error.message);
      return;
    }
    setCampaigns((prev) => prev.map((c) => (c.id === active.id ? { ...c, lines: finalLines } : c)));
    setUploadLine("전체");
    setShowLineManager(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !active) return;
    try {
      const parsed = await parseExcelFile(file);
      if (!parsed) {
        setError("매체 리포트를 인식하지 못했어요. '매체', 'Imps' 컬럼을 확인해주세요.");
        return;
      }
      const date = todayStr();
      await supabase.from("media_reports").delete().eq("campaign_id", active.id).eq("line_label", uploadLine).eq("report_date", date);
      const rows = parsed.map((r) => ({
        campaign_id: active.id,
        media: r.label,
        line_label: uploadLine,
        report_date: date,
        imps: r.imps,
        view: r.view,
        cclick: r.cclick,
        spend: r.spend,
        included: true,
      }));
      const { error } = await supabase.from("media_reports").insert(rows);
      if (error) setError("매체 리포트 저장 실패: " + error.message);
      else {
        setError("");
        await loadCampaignData(active.id);
      }
    } catch {
      setError("매체 리포트 파일을 읽는 중 문제가 발생했어요.");
    }
  };

  // 여러 파일을 한 번에 선택하면, 선택한 순서 그대로 이 캠페인의 라인 구성 순서(전체 제외)에 매칭해서 업로드한다.
  // 예: 자이스 라인이 [데스크탑_2039, 데스크탑_5059, 모바일app_2039, ...] 순이면 첫 파일 -> 데스크탑_2039, 둘째 파일 -> 데스크탑_5059 ...
  const handleBatchMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !active) return;

    const targetLines = (active.lines || []).filter((l) => l && l !== "전체");
    if (targetLines.length === 0) {
      setError("이 캠페인에 등록된 라인이 없어요. '라인 관리'에서 라인을 먼저 등록해주세요.");
      return;
    }

    const count = Math.min(files.length, targetLines.length);
    if (files.length !== targetLines.length) {
      setError(
        `파일 ${files.length}개 중 ${count}개만 처리했어요. 이 캠페인의 라인 순서는 "${targetLines.join(", ")}" (${targetLines.length}개)예요. 라인 개수만큼 파일을 선택해주세요.`
      );
    } else {
      setError("");
    }

    const date = todayStr();
    try {
      for (let i = 0; i < count; i++) {
        const line = targetLines[i];
        const parsed = await parseExcelFile(files[i]);
        if (!parsed) {
          setError((prev) => (prev ? prev + ` / "${files[i].name}"(${line}) 인식 실패` : `"${files[i].name}"(${line}) 파일을 인식하지 못했어요.`));
          continue;
        }
        await supabase.from("media_reports").delete().eq("campaign_id", active.id).eq("line_label", line).eq("report_date", date);
        const rows = parsed.map((r) => ({
          campaign_id: active.id,
          media: r.label,
          line_label: line,
          report_date: date,
          imps: r.imps,
          view: r.view,
          cclick: r.cclick,
          spend: r.spend,
          included: true,
        }));
        const { error } = await supabase.from("media_reports").insert(rows);
        if (error) setError((prev) => (prev ? prev + ` / "${line}" 저장 실패: ${error.message}` : `"${line}" 저장 실패: ${error.message}`));
      }
      await loadCampaignData(active.id);
    } catch {
      setError("여러 파일을 읽는 중 문제가 발생했어요.");
    }
  };

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = await parseMasterExcelFile(file);
      if (!parsed) {
        setError("일별 리포트를 인식하지 못했어요. '미디어명', '채널', 'Imp' 컬럼을 확인해주세요.");
        return;
      }
      // 같은 날짜 데이터는 덮어쓰고(재업로드해도 안전), 다른 날짜는 계속 쌓여서 여러 날 평균이 된다
      await supabase.from("media_library").delete().eq("source", parsed.date);
      const rows = parsed.rows.map((r) => ({
        source: parsed.date,
        line_label: r.line,
        media: r.media,
        report_date: parsed.date,
        imps: r.imps,
        view: r.view,
        cclick: r.cclick,
        spend: r.spend,
      }));
      const { error } = await supabase.from("media_library").insert(rows);
      if (error) setError("라이브러리 저장 실패: " + error.message);
      else {
        setError("");
        await loadLibrary();
      }
    } catch {
      setError("라이브러리 파일을 읽는 중 문제가 발생했어요.");
    }
  };

  const toggleMedia = async (latestRowId: string, nextIncluded: boolean) => {
    setAllMediaRows((prev) => prev.map((r) => (r.id === latestRowId ? { ...r, included: nextIncluded } : r)));
    const { error } = await supabase.from("media_reports").update({ included: nextIncluded }).eq("id", latestRowId);
    if (error) setError("매체 상태 변경 실패: " + error.message);
  };

  const updateDailyBudget = async (value: number) => {
    if (!active) return;
    setCampaigns((prev) => prev.map((c) => (c.id === active.id ? { ...c, daily_budget: value } : c)));
    const { error } = await supabase.from("campaigns").update({ daily_budget: value }).eq("id", active.id);
    if (error) setError("일예산 저장 실패: " + error.message);
  };

  // --- 계산 ---
  const profiles = useMemo(() => buildMediaProfiles(allMediaRows), [allMediaRows]);
  const includedIds = useMemo(() => new Set(profiles.filter((p) => p.included).map((p) => p.id)), [profiles]);
  const libraryProfiles = useMemo(() => buildLibraryProfiles(library), [library]);
  const libraryByKey = useMemo(() => new Map(libraryProfiles.map((l) => [l.id, l])), [libraryProfiles]);
  const librarySources = useMemo(() => [...new Set(library.map((r) => r.source || "미상"))], [library]);

  // 매체 리포트 엑셀 한 장 = 그날 하루치 실적이므로, 오늘 날짜로 업로드된 행만 그대로 모으면 오늘 실적이 된다
  const todayDate = todayStr();
  const todayMediaRows = useMemo(() => todayRowsOnly(allMediaRows, todayDate), [allMediaRows, todayDate]);
  const hasTodaySnapshot = todayMediaRows.length > 0;
  const today = useMemo(() => sumRows(todayMediaRows), [todayMediaRows]);

  const elapsed = currentSeoulHourFraction();
  const elapsedDisplay = Math.floor(elapsed);
  const remainingHrs = Math.max(0, 24 - elapsed);
  const suggestedBudget = elapsed > 0 ? (today.spend / elapsed) * 24 : today.spend;
  const dailyBudget = active?.daily_budget ?? Math.round(suggestedBudget);
  const remainingBudget = Math.max(0, dailyBudget - today.spend);

  const vtrRange = { min: targetVTRMin, max: targetVTRMax };
  const ctrRange = { min: targetCTRMin, max: targetCTRMax };

  const currentProjection = useMemo(
    () => projectFinal(today, profiles, includedIds, remainingBudget),
    [today, profiles, includedIds, remainingBudget]
  );

  const recommendations = useMemo(
    () => buildRecommendations(profiles, includedIds, today, remainingBudget, currentProjection, vtrRange, ctrRange),
    [profiles, includedIds, today, remainingBudget, currentProjection, targetVTRMin, targetVTRMax, targetCTRMin, targetCTRMax]
  );

  const statusMet = inRange(currentProjection.vtr, vtrRange) && inRange(currentProjection.ctr, ctrRange);
  const todayStatusMet = inRange(today.vtr, vtrRange) && inRange(today.ctr, ctrRange);

  // 오늘 실적 라인별 성과 (표준 라인 카테고리로 묶은 실측치)
  const lineEstimates = useMemo(() => rowsByLine(todayMediaRows), [todayMediaRows]);

  // 라인을 선택하면 게이지도 그 라인만의 실적으로 보여준다 (전체는 데스크탑_2039/데스크탑_5059처럼
  // 표준 카테고리가 같은 서로 다른 실제 라인이 섞여 있을 수 있으므로, canonicalLine으로 묶지 않고
  // 정확히 선택된 라인명(uploadLine)과 일치하는 행만 골라서 합산한다. "전체"면 캠페인 전체 오늘 값.
  const gaugeStats = useMemo(() => {
    if (uploadLine === "전체") return today;
    const filtered = todayMediaRows.filter((r) => (r.line_label || "전체") === uploadLine);
    return sumRows(filtered); // 해당 라인이 아직 업로드되지 않았으면 0으로 표시 (전체 합계로 대체하지 않음)
  }, [uploadLine, todayMediaRows]);
  const gaugeInRange = inRange(gaugeStats.vtr, vtrRange) && inRange(gaugeStats.ctr, ctrRange);
  const hasProfiles = profiles.length > 0;
  const hasData = hasProfiles && hasTodaySnapshot;

  // 현재 라인 필터 적용 + 표준 라인 카테고리로 그룹핑
  const groupedProfiles = useMemo(() => {
    const base = uploadLine === "전체" ? profiles : profiles.filter((p) => p.line === uploadLine);
    const groups = new Map<string, typeof profiles>();
    for (const p of base) {
      const key = canonicalLine(p.line);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    const keys = [...groups.keys()].sort((a, b) => {
      const ia = CANONICAL_ORDER.indexOf(a);
      const ib = CANONICAL_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return keys.map((k) => ({ key: k, rows: [...groups.get(k)!].sort((a, b) => b.spend - a.spend) }));
  }, [profiles, uploadLine]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#101826]" style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}>
      {/* 다크 컨트롤 바 */}
      <div className="bg-[#0B1220] text-[#E7EBF3]">
        <div className="max-w-[1680px] mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[#93A6C9]">
            CAMPAIGN EFFICIENCY DESK · 금일 목표 효율 달성 시뮬레이터
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {hasData && (
              <div
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border ${
                  todayStatusMet ? "text-[#4FE0C4] border-[#1C4A42] bg-[#0F2620]" : "text-[#F5987E] border-[#4A241C] bg-[#26130F]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${todayStatusMet ? "bg-[#4FE0C4]" : "bg-[#F5987E]"}`} />
                {todayStatusMet ? "금일 목표 범위 안" : "금일 목표 범위 밖"}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[12px]">
              <label className="text-[#8CA0C6] font-semibold">VTR</label>
              <input type="number" value={targetVTRMin} onChange={(e) => setTargetVTRMin(parseFloat(e.target.value) || 0)} className="w-12 px-1.5 py-1 rounded-md bg-[#151E31] border border-[#2A3752] text-white text-[13px] focus:outline-none focus:border-[#4FE0C4]" />
              <span className="text-[#5A6C8F]">~</span>
              <input type="number" value={targetVTRMax} onChange={(e) => setTargetVTRMax(parseFloat(e.target.value) || 0)} className="w-12 px-1.5 py-1 rounded-md bg-[#151E31] border border-[#2A3752] text-white text-[13px] focus:outline-none focus:border-[#4FE0C4]" />
              <label className="text-[#8CA0C6] font-semibold ml-2">CTR</label>
              <input type="number" step="0.1" value={targetCTRMin} onChange={(e) => setTargetCTRMin(parseFloat(e.target.value) || 0)} className="w-12 px-1.5 py-1 rounded-md bg-[#151E31] border border-[#2A3752] text-white text-[13px] focus:outline-none focus:border-[#4FE0C4]" />
              <span className="text-[#5A6C8F]">~</span>
              <input type="number" step="0.1" value={targetCTRMax} onChange={(e) => setTargetCTRMax(parseFloat(e.target.value) || 0)} className="w-12 px-1.5 py-1 rounded-md bg-[#151E31] border border-[#2A3752] text-white text-[13px] focus:outline-none focus:border-[#4FE0C4]" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1680px] mx-auto px-4 py-6">
        {/* 캠페인 탭 + 액션 */}
        <div className="flex items-center justify-between border-b border-[#E1E5EC] mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveId(c.id);
                  setShowNewForm(false);
                }}
                className={`px-3 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
                  activeId === c.id && !showNewForm ? "border-[#0B1220] text-[#0B1220]" : "border-transparent text-[#8792A6] hover:text-[#0B1220]"
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className={`inline-flex items-center gap-1 px-3 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
                showNewForm ? "border-[#0B1220] text-[#0B1220]" : "border-transparent text-[#8792A6] hover:text-[#0B1220]"
              }`}
            >
              <Plus size={13} /> 캠페인 추가
            </button>
          </div>
          {active && (
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => resetCampaignData(active)} className={btnDanger} title="매체 리포트 데이터만 삭제, 캠페인명/라인은 유지">
                <RotateCcw size={13} /> 데이터 초기화
              </button>
              <button onClick={() => deleteCampaign(active)} className={btnDanger} title="캠페인 전체 삭제">
                <Trash2 size={13} /> 캠페인 삭제
              </button>
            </div>
          )}
        </div>

        {showNewForm && (
          <div className={`${panel} p-4 mb-5`}>
            <div className={`${panelTitle} mb-3`}>새 캠페인 등록</div>
            <div className="mb-3">
              <label className={`${label} block mb-1`}>캠페인명</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={`${input} w-64`} placeholder="캠페인명 입력" />
            </div>
            <div className="mb-3">
              <label className={`${label} block mb-1`}>라인 구성 (이 캠페인에 실제 존재하는 라인만큼 입력)</label>
              <div className="flex flex-col gap-1.5">
                {newLines.map((l, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={l}
                      onChange={(e) => updateNewLine(i, e.target.value)}
                      placeholder={["데스크탑", "모바일app", "모바일web"][i] || "라인명 입력"}
                      className={`${input} w-56`}
                    />
                    {newLines.length > 1 && (
                      <button onClick={() => removeNewLineField(i)} className="text-[#9AA4B5] hover:text-[#C1442B] text-xs px-1">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addNewLineField} className="text-[12px] font-semibold text-[#0B1220] self-start mt-1 hover:underline">
                  + 라인 추가
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createCampaign} className={btnPrimary}>
                캠페인 만들기
              </button>
              <button onClick={() => setShowNewForm(false)} className={btn}>
                취소
              </button>
            </div>
          </div>
        )}

        {!active ? (
          <div className={`text-center text-[#8792A6] text-[13px] py-16 ${panel} border-dashed`}>캠페인을 먼저 추가해주세요.</div>
        ) : (
          <>
            {showLibraryPanel ? (
              /* ---- 매체별 평균 효율: 독립된 화면 ---- */
              <div>
                <button onClick={() => setShowLibraryPanel(false)} className={`${btn} mb-4`}>
                  ← 캠페인으로 돌아가기
                </button>
                <div className={`${panel} p-4`}>
                  <div className={panelTitle}>매체별 평균 효율</div>
                  <div className="text-[12px] text-[#8792A6] mt-1 mb-3">
                    일별 매체 리포트를 업로드하면 매체명·채널·Imp·View·Click·소진광고비를 자동으로 읽어서 쌓아요. 같은 날짜를 다시 올리면 그 날짜만 덮어쓰고, 다른 날짜는 계속 쌓여서 여러 날 평균이 됩니다.
                  </div>

                  {librarySources.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1.5 mb-4">
                      <span className="text-[11px] font-semibold text-[#8792A6] mr-1">포함된 날짜 ({librarySources.length}일치)</span>
                      {librarySources.map((s) => (
                        <span key={s} className="text-[11.5px] px-2 py-0.5 rounded-full bg-[#F4F6F9] border border-[#E1E5EC] text-[#4A5568]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-center flex-wrap mb-4">
                    <button onClick={() => libraryFileRef.current?.click()} className={btn}>
                      <Upload size={14} /> 일별 리포트 업로드
                    </button>
                    <input ref={libraryFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleLibraryUpload} className="hidden" />
                  </div>
                  {error && <div className="text-[#C1442B] text-[13px] mb-3">{error}</div>}
                  {libraryProfiles.length === 0 ? (
                    <div className="text-[13px] text-[#8792A6]">아직 쌓인 라이브러리 데이터가 없어요.</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 mb-3 border-b border-[#E1E5EC]">
                        {["전체", ...LIBRARY_LINE_OPTIONS].map((l) => (
                          <button
                            key={l}
                            onClick={() => setLibViewLine(l)}
                            className={`px-3 py-2 text-[12.5px] font-medium -mb-px border-b-2 transition-colors ${
                              libViewLine === l ? "border-[#0B1220] text-[#0B1220]" : "border-transparent text-[#8792A6] hover:text-[#0B1220]"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wide text-[#8792A6] bg-[#F7F8FA] border-b border-[#E1E5EC]">
                              <th className="text-left py-2 px-3 font-semibold">매체</th>
                              {libViewLine === "전체" && <th className="text-left py-2 px-3 font-semibold">라인</th>}
                              <th className="text-right py-2 px-3 font-semibold">일수</th>
                              <th className="text-right py-2 px-3 font-semibold">평균 VTR</th>
                              <th className="text-right py-2 px-3 font-semibold">평균 CTR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...libraryProfiles]
                              .filter((l) => libViewLine === "전체" || (l.line === libViewLine && l.imps > 0))
                              .sort((a, b) => profileMetrics(b).vtr - profileMetrics(a).vtr)
                              .map((l) => {
                                const { vtr, ctr } = profileMetrics(l);
                                return (
                                  <tr key={l.id} className="border-t border-[#EEF0F4] hover:bg-[#FAFBFC]">
                                    <td className="py-2 px-3 font-medium">{l.media}</td>
                                    {libViewLine === "전체" && <td className="py-2 px-3 text-[#64748B]">{l.line}</td>}
                                    <td className="text-right py-2 px-3 font-mono tabular-nums">{l.campaignCount}</td>
                                    <td className="text-right py-2 px-3 font-mono tabular-nums">{fmt(vtr)}%</td>
                                    <td className="text-right py-2 px-3 font-mono tabular-nums">{fmt(ctr)}%</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* 업로드 & 조회 툴바 */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className={toolbarGroup}>
                    <select value={uploadLine} onChange={(e) => setUploadLine(e.target.value)} className={`${input} border-none bg-[#F4F6F9]`}>
                      {lineOptions.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => mediaFileRef.current?.click()} className={btn}>
                      <Upload size={14} /> 매체 리포트 업로드
                    </button>
                    <input ref={mediaFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleMediaUpload} className="hidden" />
                    <button onClick={openLineManager} className={btn}>
                      <SlidersHorizontal size={14} /> 라인 관리
                    </button>
                  </div>

                  <div className={toolbarGroup}>
                    <button
                      onClick={() => batchFileRef.current?.click()}
                      className={btn}
                      title={`파일을 여러 개 선택하면 선택한 순서 그대로 아래 라인 순서에 매칭돼요:\n${lineOptions.slice(1).join(" → ") || "(등록된 라인 없음)"}`}
                    >
                      <Files size={14} /> 여러 파일 한번에 업로드
                    </button>
                    <input ref={batchFileRef} type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleBatchMediaUpload} className="hidden" />
                  </div>

                  <div className={toolbarGroup}>
                    <button onClick={() => setShowLibraryPanel(true)} className={btn}>
                      <Library size={14} /> 매체별 평균 효율
                    </button>
                  </div>
                </div>

                <div className="text-[11.5px] text-[#8792A6] mb-4 -mt-2">
                  라인 선택은 <b>① 업로드할 파일이 어느 라인 것인지</b>, <b>② 오른쪽 매체 표를 어느 라인만 필터해서 볼지</b> 둘 다에 사용돼요. &quot;전체&quot;를 선택하면 모든 라인을 라인별로 묶어서 보여줘요.
                  <br />
                  <b>여러 파일 한번에 업로드</b>는 선택한 파일 순서를 라인 구성 순서(<span className="font-mono">{lineOptions.slice(1).join(" → ") || "-"}</span>)에 그대로 매칭해요. 파일 탐색기에서 원하는 순서대로 클릭해 선택해주세요.
                </div>

                {showLineManager && (
                  <div className={`${panel} p-4 mb-4`}>
                    <div className={`${panelTitle} mb-3`}>&quot;{active.name}&quot; 라인 구성 편집</div>
                    <div className="flex flex-col gap-1.5 mb-3">
                      {editLines.map((l, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={l}
                            onChange={(e) => updateEditLine(i, e.target.value)}
                            placeholder={["데스크탑", "모바일app", "모바일web"][i] || "라인명 입력"}
                            className={`${input} w-56`}
                          />
                          {editLines.length > 1 && (
                            <button onClick={() => removeEditLineField(i)} className="text-[#9AA4B5] hover:text-[#C1442B] text-xs px-1">
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={addEditLineField} className="text-[12px] font-semibold text-[#0B1220] self-start mt-1 hover:underline">
                        + 라인 추가
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveLines} className={btnPrimary}>
                        저장
                      </button>
                      <button onClick={() => setShowLineManager(false)} className={btn}>
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {error && <div className="text-[#C1442B] text-[13px] mb-3">{error}</div>}
                {loading && <div className="text-[#8792A6] text-[13px] mb-3">불러오는 중...</div>}

            {!hasProfiles ? (
              <div className={`text-center text-[#8792A6] text-[13px] py-16 ${panel} border-dashed`}>
                &quot;{active.name}&quot; 캠페인에 라인별 매체 리포트를 업로드해주세요.
              </div>
            ) : !hasTodaySnapshot ? (
              <div className={`text-center text-[#8792A6] text-[13px] py-16 ${panel} border-dashed`}>
                오늘({todayDate}) 매체 리포트가 아직 없어요. 오늘자 리포트를 업로드해주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 items-start">
                {/* 왼쪽: 오늘 현황 / 예산 / 게이지 / 추천 */}
                <div className="flex flex-col gap-4">
                  <div className={`${panel} p-4`}>
                    <div className={panelTitle}>
                      금일 진행 현황 {uploadLine !== "전체" && <span className="text-[#8792A6] normal-case font-medium">· {uploadLine}</span>} (00:00 ~ {String(elapsedDisplay).padStart(2, "0")}:00 현재)
                    </div>
                    <div className="flex gap-4 justify-center my-4">
                      <Gauge label="VTR" value={gaugeStats.vtr} rangeMin={targetVTRMin} rangeMax={targetVTRMax} maxScale={100} />
                      <Gauge label="CTR" value={gaugeStats.ctr} rangeMin={targetCTRMin} rangeMax={targetCTRMax} maxScale={Math.max(targetCTRMax * 3, 5)} />
                    </div>
                    <div className={`font-bold text-[13px] text-center mb-3 ${gaugeInRange ? "text-[#0E8074]" : "text-[#C1442B]"}`}>
                      {gaugeInRange ? "목표 범위 안" : "목표 범위 밖"}
                    </div>
                    <div className="flex justify-center gap-8 text-[13px] pt-3 border-t border-[#EEF0F4]">
                      <div>
                        <div className={label}>Imps.</div>
                        <div className="font-bold text-[16px] font-mono tabular-nums">{fmtInt(gaugeStats.imps)}</div>
                      </div>
                      <div>
                        <div className={label}>소진액</div>
                        <div className="font-bold text-[16px] font-mono tabular-nums">{fmtInt(gaugeStats.spend)}원</div>
                      </div>
                    </div>
                  </div>

                  <div className={`${panel} p-4`}>
                    <div className={panelTitle}>일예산 &amp; 남은 예산</div>
                    <div className="flex gap-6 text-[13px] items-end flex-wrap mt-3">
                      <div>
                        <div className={`${label} mb-1`}>일예산(원)</div>
                        <input
                          type="number"
                          value={dailyBudget}
                          onChange={(e) => updateDailyBudget(parseFloat(e.target.value) || 0)}
                          className={`${input} w-32 font-mono tabular-nums font-bold`}
                        />
                      </div>
                      <div>
                        <div className={label}>남은 예산</div>
                        <div className="font-bold text-[17px] font-mono tabular-nums">{fmtInt(remainingBudget)}원</div>
                      </div>
                      <div>
                        <div className={label}>남은 시간</div>
                        <div className="font-bold text-[17px] font-mono tabular-nums">{remainingHrs}시간</div>
                      </div>
                    </div>
                  </div>

                  {lineEstimates.length > 1 && (
                    <div className={`${panel} p-4`}>
                      <div className={panelTitle}>라인별 오늘 실적</div>
                      <div className="overflow-x-auto mt-3">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wide text-[#8792A6] bg-[#F7F8FA] border-b border-[#E1E5EC]">
                              <th className="text-left py-2 px-3 font-semibold">라인</th>
                              <th className="text-right py-2 px-3 font-semibold">소진액</th>
                              <th className="text-right py-2 px-3 font-semibold">VTR</th>
                              <th className="text-right py-2 px-3 font-semibold">CTR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...lineEstimates]
                              .sort((a, b) => {
                                const ia = CANONICAL_ORDER.indexOf(a.line);
                                const ib = CANONICAL_ORDER.indexOf(b.line);
                                if (ia === -1 && ib === -1) return a.line.localeCompare(b.line);
                                if (ia === -1) return 1;
                                if (ib === -1) return -1;
                                return ia - ib;
                              })
                              .map((le) => (
                              <tr key={le.line} className="border-t border-[#EEF0F4] hover:bg-[#FAFBFC]">
                                <td className="py-2 px-3 font-medium">{le.line}</td>
                                <td className="text-right py-2 px-3 font-mono tabular-nums">{fmtInt(le.spend)}원</td>
                                <td className={`text-right py-2 px-3 font-mono tabular-nums ${inRange(le.vtr, vtrRange) ? "text-[#0E8074]" : "text-[#C1442B]"}`}>{fmt(le.vtr)}%</td>
                                <td className={`text-right py-2 px-3 font-mono tabular-nums ${inRange(le.ctr, ctrRange) ? "text-[#0E8074]" : "text-[#C1442B]"}`}>{fmt(le.ctr)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 추천 */}
                  <div className={`${panel} p-4`}>
                    <div className={`${panelTitle} mb-3`}>조정 추천</div>
                    <div className="text-[11.5px] text-[#8792A6] -mt-2 mb-3">매체 하나씩이 아니라, 함께 조정했을 때 목표 범위에 가장 빨리 도달하는 조합을 순위별로 제안해요.</div>
                    {recommendations.length === 0 ? (
                      <div className="text-[13px] text-[#8792A6]">{statusMet ? "남은 예산을 지금 구성대로 쓰면 목표 범위 안에 들어올 것으로 예상돼요." : "현재 데이터에서는 뚜렷한 개선 후보가 없어요."}</div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {recommendations.map((bundle) => (
                          <div key={bundle.rank} className="px-3 py-2.5 rounded-md border border-[#E1E5EC] bg-[#FAFBFC]">
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
                                return (
                                  <div
                                    key={a.profile.id}
                                    className={`px-2.5 py-1.5 rounded border-l-2 text-[12.5px] ${isCut ? "border-l-[#C1442B] bg-[#FBEAE6]" : "border-l-[#0E8074] bg-[#E9F5F2]"}`}
                                  >
                                    <span className="font-semibold">
                                      {idx + 1}. {a.profile.media} <span className="text-[#8792A6] font-normal">({a.profile.line})</span>
                                    </span>{" "}
                                    <span className={`font-bold ${isCut ? "text-[#C1442B]" : "text-[#0E8074]"}`}>{a.action}</span>
                                    {lib && (
                                      <span className="text-[#8792A6] font-mono"> · 라이브러리 평균 {fmt(lib.vtr)}% (현재 {fmt(cur.vtr)}%)</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-[11.5px] text-[#8792A6] font-mono">
                              조정 후 예상 VTR {fmt(bundle.proj.vtr)}% ({bundle.deltaVTR >= 0 ? "+" : ""}
                              {fmt(bundle.deltaVTR)}%p) · 예상 CTR {fmt(bundle.proj.ctr)}% ({bundle.deltaCTR >= 0 ? "+" : ""}
                              {fmt(bundle.deltaCTR)}%p)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 오른쪽: 매체 테이블 (라인 선택 옆에 바로 보이도록 sticky) */}
                <div className={`${panel} overflow-hidden xl:sticky xl:top-4`}>
                  <div className="px-4 py-3 border-b border-[#E1E5EC]">
                    <div className={panelTitle}>매체 상세</div>
                    <div className="text-[11.5px] text-[#8792A6] mt-0.5">라인별로 묶어서 표시 · 작은 회색 숫자는 매체별 평균 효율</div>
                  </div>
                  <div className="overflow-x-auto max-h-[calc(100vh-140px)] overflow-y-auto">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0 z-10">
                        <tr className="text-[11px] uppercase tracking-wide text-[#8792A6] bg-[#F7F8FA] border-b border-[#E1E5EC]">
                          <th className="w-8"></th>
                          <th className="text-left py-2 px-3 font-semibold">매체</th>
                          <th className="text-right py-2 px-3 font-semibold">VTR</th>
                          <th className="text-right py-2 px-3 font-semibold">CTR</th>
                          <th className="text-right py-2 px-3 font-semibold">소진액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedProfiles.map((g) => (
                          <Fragment key={g.key}>
                            <tr>
                              <td colSpan={5} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#4A5568] bg-[#F7F8FA] border-t border-[#E1E5EC]">
                                {g.key} <span className="text-[#9AA4B5] font-normal normal-case">· {g.rows.length}개 매체</span>
                              </td>
                            </tr>
                            {g.rows.map((p) => {
                              const { vtr, ctr } = profileMetrics(p);
                              const libKey = `${p.media}__${canonicalLine(p.line)}`;
                              const libMatch = libraryByKey.get(libKey);
                              const lib = libMatch ? profileMetrics(libMatch) : null;
                              return (
                                <tr key={p.id} className={`border-t border-[#EEF0F4] hover:bg-[#FAFBFC] ${p.included ? "" : "opacity-40"}`}>
                                  <td className="text-center py-2 px-3">
                                    <input type="checkbox" checked={p.included} onChange={() => toggleMedia(p.latestRowId, !p.included)} className="accent-[#0B1220]" />
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="font-medium">{p.media}</span>
                                    {uploadLine === "전체" && p.line !== g.key && <span className="text-[11px] text-[#9AA4B5] ml-1.5">{p.line}</span>}
                                  </td>
                                  <td className="text-right py-2 px-3">
                                    <div className="font-mono tabular-nums font-semibold">{p.imps ? `${fmt(vtr)}%` : "-"}</div>
                                    {lib && <div className="font-mono tabular-nums text-[11px] text-[#9AA4B5]">평균 {fmt(lib.vtr)}%</div>}
                                  </td>
                                  <td className="text-right py-2 px-3">
                                    <div className="font-mono tabular-nums font-semibold">{p.imps ? `${fmt(ctr)}%` : "-"}</div>
                                    {lib && <div className="font-mono tabular-nums text-[11px] text-[#9AA4B5]">평균 {fmt(lib.ctr)}%</div>}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono tabular-nums">{fmtInt(p.spend)}</td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
