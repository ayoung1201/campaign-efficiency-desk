export interface Campaign {
  id: string;
  name: string;
  daily_budget: number | null;
  lines: string[]; // 캠페인 등록 시 정의한 라인 목록 (예: ["데스크탑_2039","모바일app_5059",...])
  created_at: string;
}

export interface MediaRow {
  id: string;
  campaign_id: string;
  media: string;
  line_label: string;
  report_date: string;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
  included: boolean;
  uploaded_at: string;
}

export interface HourlyRow {
  id: string;
  campaign_id: string;
  hour_label: string;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
  report_date: string;
}

// 지금 조정 중인 캠페인과 무관하게, 여러 과거 캠페인의 매체 데이터를 계속 쌓아두는 참고용 라이브러리
export interface MediaLibraryRow {
  id: string;
  source: string; // 어떤 캠페인에서 온 데이터인지 (자유 입력)
  line_label: string;
  media: string;
  report_date: string;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
}

export interface Stats {
  imps: number;
  view: number;
  cclick: number;
  spend: number;
  vtr: number;
  ctr: number;
}

export interface MediaProfile {
  id: string;
  latestRowId: string;
  media: string;
  line: string;
  days: number;
  imps: number;
  view: number;
  cclick: number;
  spend: number;
  included: boolean;
}

// 라이브러리 데이터를 (매체+라인) 단위로 묶은 참고용 프로필
export interface LibraryProfile {
  id: string;
  media: string;
  line: string;
  campaignCount: number; // 몇 개의 서로 다른 출처(캠페인)에서 온 데이터인지
  imps: number;
  view: number;
  cclick: number;
  spend: number;
}
