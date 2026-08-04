"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Campaign, MediaLibraryRow, MediaRow } from "../lib/types";
import { parseExcelFile, parseMasterExcelFile } from "../lib/xlsxParse";
import {
  buildLibraryProfiles,
  buildMediaProfiles,
  buildRecommendations,
  canonicalLine,
  currentSeoulHourFraction,
  inRange,
  projectFinal,
  rowsByLine,
  sumRows,
  todayRowsOnly,
  todayStr,
} from "../lib/calculations";
import { CANONICAL_ORDER } from "../lib/constants";
import Sidebar from "../components/Sidebar";
import NewCampaignForm from "../components/NewCampaignForm";
import LineManagerModal from "../components/LineManagerModal";
import BannedMediaModal from "../components/BannedMediaModal";
import LibraryPanel from "../components/LibraryPanel";
import UploadToolbar from "../components/UploadToolbar";
import BatchUploadModal from "../components/BatchUploadModal";
import CampaignHeader from "../components/CampaignHeader";
import StatusCard from "../components/StatusCard";
import ProjectionCard from "../components/ProjectionCard";
import BudgetCard from "../components/BudgetCard";
import LineBreakdownCard from "../components/LineBreakdownCard";
import RecommendationsCard from "../components/RecommendationsCard";
import MediaDetailGrid from "../components/MediaDetailGrid";
import { panel } from "../components/ui";

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
  const [newLines, setNewLines] = useState<string[]>([...CANONICAL_ORDER]);

  const [showLineManager, setShowLineManager] = useState(false);
  const [editLines, setEditLines] = useState<string[]>([]);

  const [showBannedMediaManager, setShowBannedMediaManager] = useState(false);
  const [editBannedMedia, setEditBannedMedia] = useState<string[]>([]);

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
    setNewLines([...CANONICAL_ORDER]);
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

  const openBannedMediaManager = () => {
    if (!active) return;
    setEditBannedMedia(active.banned_media ? [...active.banned_media] : []);
    setShowBannedMediaManager(true);
  };
  const toggleEditBannedMedia = (media: string) =>
    setEditBannedMedia((prev) => (prev.includes(media) ? prev.filter((m) => m !== media) : [...prev, media]));
  const removeEditBannedMedia = (media: string) => setEditBannedMedia((prev) => prev.filter((m) => m !== media));
  const addCustomBannedMedia = (media: string) =>
    setEditBannedMedia((prev) => (prev.includes(media) ? prev : [...prev, media]));
  const saveBannedMedia = async () => {
    if (!active) return;
    const finalBanned = editBannedMedia.map((l) => l.trim()).filter(Boolean);
    const { error } = await supabase.from("campaigns").update({ banned_media: finalBanned }).eq("id", active.id);
    if (error) {
      setError("노출 불가 매체 저장 실패: " + error.message);
      return;
    }
    setCampaigns((prev) => prev.map((c) => (c.id === active.id ? { ...c, banned_media: finalBanned } : c)));
    setShowBannedMediaManager(false);
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

  // 브라우저 파일 선택창은 사용자가 클릭한 순서를 보장해주지 않는다(보통 탐색기 정렬 순서로 옴).
  // 그래서 파일을 고르자마자 바로 업로드하지 않고, 각 파일에 라인을 직접 지정하는 확인 모달을 띄운다.
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [batchAssignments, setBatchAssignments] = useState<string[]>([]);

  const onBatchFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !active) return;
    const targetLines = (active.lines || []).filter((l) => l && l !== "전체");
    if (targetLines.length === 0) {
      setError("이 캠페인에 등록된 라인이 없어요. '라인 관리'에서 라인을 먼저 등록해주세요.");
      return;
    }
    setError("");
    setBatchFiles(files);
    const reversedLines = [...targetLines].reverse();
    setBatchAssignments(files.map((_, i) => reversedLines[i] ?? ""));
  };

  const cancelBatchUpload = () => {
    setBatchFiles(null);
    setBatchAssignments([]);
  };

  const confirmBatchUpload = async () => {
    if (!batchFiles || !active) return;
    const date = todayStr();
    setError("");
    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const line = batchAssignments[i];
        if (!line) continue; // 라인을 지정하지 않은 파일은 건너뜀
        const parsed = await parseExcelFile(batchFiles[i]);
        if (!parsed) {
          setError((prev) => (prev ? prev + ` / "${batchFiles[i].name}"(${line}) 인식 실패` : `"${batchFiles[i].name}"(${line}) 파일을 인식하지 못했어요.`));
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
    } finally {
      setBatchFiles(null);
      setBatchAssignments([]);
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

  // 노출 불가 매체를 검색/선택할 때 보여줄 후보 목록 - 이 캠페인에 실제로 올라온 매체 + 라이브러리 전체 매체
  const availableMediaForBan = useMemo(() => {
    const names = new Set<string>();
    for (const p of profiles) names.add(p.media);
    for (const l of libraryProfiles) names.add(l.media);
    return [...names].sort((a, b) => a.localeCompare(b, "ko"));
  }, [profiles, libraryProfiles]);

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

  // 이 캠페인에서 노출되면 안 되는 매체 목록 - 조정 추천이 이 매체를 "추가" 후보로 절대 제안하지 않도록 걸러내고,
  // 매체 상세에서도 실적이 있으면 눈에 띄게 경고 표시한다.
  const bannedMedia = useMemo(() => new Set((active?.banned_media || []).map((m) => m.trim()).filter(Boolean)), [active]);

  const currentProjection = useMemo(
    () => projectFinal(today, profiles, includedIds, remainingBudget),
    [today, profiles, includedIds, remainingBudget]
  );

  const recommendations = useMemo(
    () => buildRecommendations(profiles, includedIds, today, remainingBudget, currentProjection, vtrRange, ctrRange, libraryProfiles, bannedMedia),
    // vtrRange/ctrRange는 매 렌더마다 새로 만들어지는 객체라 deps에 넣으면 메모이제이션이 무의미해진다.
    // 실제 값 변화는 이미 targetVTRMin/Max, targetCTRMin/Max로 추적되므로 그것만 deps에 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profiles, includedIds, today, remainingBudget, currentProjection, targetVTRMin, targetVTRMax, targetCTRMin, targetCTRMax, libraryProfiles, bannedMedia]
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
  }, [uploadLine, todayMediaRows, today]);
  const gaugeInRange = inRange(gaugeStats.vtr, vtrRange) && inRange(gaugeStats.ctr, ctrRange);
  const hasProfiles = profiles.length > 0;
  const hasData = hasProfiles && hasTodaySnapshot;

  // 현재 라인 필터 적용 + 원본 라인명 그대로 그룹핑 (표준 카테고리로 합치지 않음 - 데스크탑_2039/5059처럼
  // 같은 카테고리 안에 서로 다른 실제 라인이 있으면 매체 상세에서는 그 라인 그대로 따로 보여준다)
  const groupedProfiles = useMemo(() => {
    const base = uploadLine === "전체" ? profiles : profiles.filter((p) => p.line === uploadLine);
    const groups = new Map<string, typeof profiles>();
    for (const p of base) {
      const key = p.line || "전체";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    const keys = [...groups.keys()].sort((a, b) => {
      const ca = canonicalLine(a);
      const cb = canonicalLine(b);
      const ia = CANONICAL_ORDER.indexOf(ca);
      const ib = CANONICAL_ORDER.indexOf(cb);
      if (ia !== ib) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    return keys.map((k) => ({ key: k, canon: canonicalLine(k), rows: [...groups.get(k)!].sort((a, b) => b.spend - a.spend) }));
  }, [profiles, uploadLine]);

  return (
    <div className="min-h-screen flex bg-[#F4F6F9] text-[#101826]">
      <Sidebar
        campaigns={campaigns}
        activeId={activeId}
        showNewForm={showNewForm}
        showLibraryPanel={showLibraryPanel}
        onSelectCampaign={(id) => {
          setActiveId(id);
          setShowNewForm(false);
          setShowLibraryPanel(false);
        }}
        onToggleNewForm={() => {
          setShowNewForm((v) => !v);
          setShowLibraryPanel(false);
        }}
        onShowLibrary={() => setShowLibraryPanel(true)}
        targetVTRMin={targetVTRMin}
        targetVTRMax={targetVTRMax}
        targetCTRMin={targetCTRMin}
        targetCTRMax={targetCTRMax}
        setTargetVTRMin={setTargetVTRMin}
        setTargetVTRMax={setTargetVTRMax}
        setTargetCTRMin={setTargetCTRMin}
        setTargetCTRMax={setTargetCTRMax}
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1680px] mx-auto px-6 py-6">
          {showNewForm && (
            <NewCampaignForm
              newName={newName}
              setNewName={setNewName}
              newLines={newLines}
              updateNewLine={updateNewLine}
              addNewLineField={addNewLineField}
              removeNewLineField={removeNewLineField}
              onCreate={createCampaign}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {showLibraryPanel ? (
            <LibraryPanel
              librarySources={librarySources}
              libraryProfiles={libraryProfiles}
              libViewLine={libViewLine}
              setLibViewLine={setLibViewLine}
              error={error}
              libraryFileRef={libraryFileRef}
              onUpload={handleLibraryUpload}
            />
          ) : !active ? (
            <div className={`text-center text-[#8792A6] text-[13px] py-16 ${panel} border-dashed`}>캠페인을 먼저 추가해주세요.</div>
          ) : (
            <>
              <CampaignHeader active={active} showStatusBadge={hasData} statusMet={todayStatusMet} onReset={resetCampaignData} onDelete={deleteCampaign} />

              <UploadToolbar
                uploadLine={uploadLine}
                setUploadLine={setUploadLine}
                lineOptions={lineOptions}
                mediaFileRef={mediaFileRef}
                onMediaUpload={handleMediaUpload}
                onOpenLineManager={openLineManager}
                onOpenBannedMediaManager={openBannedMediaManager}
                batchFileRef={batchFileRef}
                onBatchFilesSelected={onBatchFilesSelected}
              />

              {batchFiles && (
                <BatchUploadModal
                  files={batchFiles}
                  assignments={batchAssignments}
                  lineOptions={lineOptions.slice(1)}
                  onChangeAssignment={(i, line) => setBatchAssignments((prev) => prev.map((a, idx) => (idx === i ? line : a)))}
                  onConfirm={confirmBatchUpload}
                  onCancel={cancelBatchUpload}
                />
              )}

              {showLineManager && (
                <LineManagerModal
                  campaignName={active.name}
                  editLines={editLines}
                  updateEditLine={updateEditLine}
                  addEditLineField={addEditLineField}
                  removeEditLineField={removeEditLineField}
                  onSave={saveLines}
                  onCancel={() => setShowLineManager(false)}
                />
              )}

              {showBannedMediaManager && (
                <BannedMediaModal
                  campaignName={active.name}
                  availableMedia={availableMediaForBan}
                  selected={editBannedMedia}
                  onToggle={toggleEditBannedMedia}
                  onRemove={removeEditBannedMedia}
                  onAddCustom={addCustomBannedMedia}
                  onSave={saveBannedMedia}
                  onCancel={() => setShowBannedMediaManager(false)}
                />
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
                <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4 items-start">
                  {/* 왼쪽: 오늘 현황 / 예산 / 라인별 실적 / 추천 */}
                  <div className="flex flex-col gap-4">
                    <StatusCard
                      uploadLine={uploadLine}
                      elapsedDisplay={elapsedDisplay}
                      gaugeStats={gaugeStats}
                      gaugeInRange={gaugeInRange}
                      targetVTRMin={targetVTRMin}
                      targetVTRMax={targetVTRMax}
                      targetCTRMin={targetCTRMin}
                      targetCTRMax={targetCTRMax}
                    />

                    <ProjectionCard
                      currentProjection={currentProjection}
                      statusMet={statusMet}
                      targetVTRMin={targetVTRMin}
                      targetVTRMax={targetVTRMax}
                      targetCTRMin={targetCTRMin}
                      targetCTRMax={targetCTRMax}
                    />

                    <BudgetCard
                      dailyBudget={dailyBudget}
                      onChangeDailyBudget={updateDailyBudget}
                      remainingBudget={remainingBudget}
                      remainingHrs={remainingHrs}
                    />

                    {lineEstimates.length > 1 && <LineBreakdownCard lineEstimates={lineEstimates} vtrRange={vtrRange} ctrRange={ctrRange} />}

                    <RecommendationsCard recommendations={recommendations} statusMet={statusMet} libraryByKey={libraryByKey} />
                  </div>

                  {/* 오른쪽: 매체 상세 - 라인별 카드를 가로로 나란히 배치 */}
                  <MediaDetailGrid groupedProfiles={groupedProfiles} libraryByKey={libraryByKey} onToggleMedia={toggleMedia} bannedMedia={bannedMedia} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
