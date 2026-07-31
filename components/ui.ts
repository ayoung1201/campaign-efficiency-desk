// 여러 컴포넌트에서 공유하는 스타일 토큰
export const btn =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#D7DCE5] bg-white text-[13px] font-medium text-[#334155] hover:border-[#0B1220] hover:bg-[#F4F6F9] hover:text-[#0B1220] transition-colors";
export const btnPrimary = "px-4 py-2 rounded-md bg-[#0B1220] text-white text-[13px] font-semibold hover:bg-[#182338] transition-colors";
export const btnDanger =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E7C9C2] bg-white text-[12.5px] font-semibold text-[#C1442B] hover:bg-[#FBEAE6] transition-colors";
export const toolbarGroup = "flex items-center gap-1.5 bg-white border border-[#E1E5EC] rounded-md p-1.5";
export const input = "px-2.5 py-1.5 rounded-md border border-[#D7DCE5] text-[13px] bg-white focus:outline-none focus:border-[#0B1220]";
export const panel = "bg-white border border-[#E1E5EC] rounded-lg shadow-[0_1px_2px_rgba(16,24,38,0.04)]";
export const panelTitle = "text-[12px] font-semibold uppercase tracking-wide text-[#4A5568]";
export const label = "text-[11px] font-semibold uppercase tracking-wide text-[#8792A6]";
export const theadRow = "text-[11.5px] font-medium text-[#9AA4B5] border-b border-[#EEF0F4]";
export const navItem = (activeState: boolean) =>
  `w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
    activeState ? "bg-white/10 text-white" : "text-[#A9B6D0] hover:bg-white/5 hover:text-white"
  }`;
export const sidebarNumInput =
  "w-11 px-1.5 py-1 rounded-md bg-[#151E31] border border-[#2A3752] text-white text-[12px] text-center focus:outline-none focus:border-[#4FE0C4]";
