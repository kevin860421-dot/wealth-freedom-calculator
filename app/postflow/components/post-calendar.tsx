"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X, Clock } from "lucide-react";

/* ─── Platform meta ──────────────────────────────────────── */
const PLATFORMS = [
  "Blogger", "FB", "IG", "Threads", "Dcard", "方格子", "Mobile01", "痞客邦", "Medium",
] as const;
type Platform = typeof PLATFORMS[number];

const PLATFORM_STYLE: Record<Platform, { label: string; hex: string }> = {
  "Blogger":  { label: "B",  hex: "#FF5722" },
  "FB":       { label: "f",  hex: "#1877F2" },
  "IG":       { label: "ig", hex: "#C32AA3" },
  "Threads":  { label: "@",  hex: "#6B6B6B" },
  "Dcard":    { label: "D",  hex: "#EE4D5E" },
  "方格子":   { label: "方", hex: "#F59E0B" },
  "Mobile01": { label: "01", hex: "#EA580C" },
  "痞客邦":   { label: "痞", hex: "#FF6600" },
  "Medium":   { label: "M",  hex: "#525252" },
};

/* ─── Mock schedule ──────────────────────────────────────── */
function mockSchedule(): Record<number, Platform[]> {
  const sched: Record<number, Platform[]> = {};
  const pf = [...PLATFORMS];
  for (let d = 0; d < 28; d++) {
    if (d % 2 === 0) sched[d] = [pf[d % pf.length], pf[(d + 3) % pf.length]];
    if (d % 7 === 0) sched[d] = [pf[d % pf.length]];
  }
  return sched;
}

const DAYS_OF_WEEK = ["日", "一", "二", "三", "四", "五", "六"];

type DayStatus = "past" | "today" | "tomorrow" | "future";

function getDayStatus(date: Date): DayStatus {
  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const d        = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d < today)                          return "past";
  if (d.getTime() === today.getTime())    return "today";
  if (d.getTime() === tomorrow.getTime()) return "tomorrow";
  return "future";
}

function fmt(date: Date) { return `${date.getMonth() + 1}/${date.getDate()}`; }

/* ─── Semantic color system (Slate-based) ────────────────── */
// Past:     Slate-100 bg  / Slate-400 text  — muted, clearly historical
// Today:    Blue-50 bg    / Blue-600 border — highlighted, prominent
// Tomorrow: Violet-50 bg  / Violet-400 border — upcoming, warm alert
// Scheduled: White bg    / Blue-200 border — clean, active
// Empty:    Slate-50 bg  / Slate-200 border — neutral placeholder

const CELL_STYLE: Record<DayStatus, (hasSchedule: boolean) => React.CSSProperties> = {
  past:     () => ({ background: "#F1F5F9", border: "1px solid #E2E8F0" }),
  today:    () => ({ background: "#EFF6FF", border: "2px solid #3B82F6" }),
  tomorrow: (has) => has
    ? { background: "#FDF4FF", border: "1.5px solid #C084FC" }
    : { background: "#F8FAFC", border: "1px solid #E2E8F0" },
  future:   (has) => has
    ? { background: "#FFFFFF", border: "1px solid #BFDBFE" }
    : { background: "#F8FAFC", border: "1px solid #E2E8F0" },
};

const DATE_COLOR: Record<DayStatus, string> = {
  past:     "#94A3B8",   // Slate-400 — muted
  today:    "#1D4ED8",   // Blue-700 — strong
  tomorrow: "#7C3AED",   // Violet-700 — warm
  future:   "#0F172A",   // Slate-900 — dark
};

/* ─── Platform chip ──────────────────────────────────────── */
function PlatformChip({ platform, status }: { platform: Platform; status: DayStatus }) {
  const { label, hex } = PLATFORM_STYLE[platform];
  return (
    <span className="relative inline-flex shrink-0">
      <span title={platform} style={{ background: hex }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white">
        {label}
      </span>
      {status === "past" && (
        <CheckCircle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-emerald-500"
          style={{ background: "white", borderRadius: "50%" }} strokeWidth={2.5} />
      )}
    </span>
  );
}

/* ─── Popup ──────────────────────────────────────────────── */
interface PopupData { status: DayStatus; realDate: string; dayNum: number; platforms: Platform[]; }

function DayPopup({ data, onClose }: { data: PopupData; onClose: () => void }) {
  const titleMap: Record<DayStatus, string> = {
    past: "歷史發布回顧", today: "今日排程", tomorrow: "明日預計發布", future: "預計發布內容",
  };
  const accentMap: Record<DayStatus, string> = {
    past: "#64748B", today: "#1D4ED8", tomorrow: "#7C3AED", future: "#0F172A",
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl shadow-xl w-76 p-5 space-y-4"
        style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", minWidth: "288px" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: accentMap[data.status] }}>
              {titleMap[data.status]}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "#475569" }}>
              {data.realDate} · Day {data.dayNum}
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
            style={{ color: "#64748B" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {data.platforms.length > 0 ? (
          <ul className="space-y-2.5">
            {data.platforms.map(p => {
              const { label, hex } = PLATFORM_STYLE[p];
              return (
                <li key={p} className="flex items-center gap-3">
                  <span style={{ background: hex }}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white">
                    {label}
                  </span>
                  <span className="flex-1 text-sm font-medium" style={{ color: "#1E293B" }}>{p}</span>
                  {data.status === "past"     && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" />已發布</span>}
                  {data.status === "today"    && <span className="flex items-center gap-1 text-xs font-semibold text-blue-600"><Clock className="h-3 w-3" />進行中</span>}
                  {(data.status === "future" || data.status === "tomorrow") && (
                    <span className="text-xs font-medium" style={{ color: "#7C3AED" }}>排程中</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-center py-2 font-medium" style={{ color: "#94A3B8" }}>此日無排程任務</p>
        )}

        <p className="text-xs pt-3 font-medium" style={{ color: "#64748B", borderTop: "1px solid #E2E8F0" }}>
          {data.status === "past" ? "點擊平台可查看發布內容（即將支援）" : "可在母版編輯器調整排程內容"}
        </p>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonCal() {
  return (
    <div className="grid grid-cols-7 gap-1.5 animate-pulse">
      {Array.from({ length: 28 }).map((_, i) => (
        <div key={i} className="h-[82px] rounded-xl" style={{ background: "#E2E8F0" }} />
      ))}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export interface PostCalendarProps { startDate?: Date; }

export function PostCalendar({ startDate }: PostCalendarProps) {
  const [loaded, setLoaded] = useState(false);
  const [popup,  setPopup]  = useState<PopupData | null>(null);

  const baseDay = (() => {
    const b = startDate ?? new Date();
    return new Date(b.getFullYear(), b.getMonth(), b.getDate());
  })();

  const schedule = mockSchedule();

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 900); return () => clearTimeout(t); }, []);
  if (!loaded) return <SkeletonCal />;

  const startDow = baseDay.getDay();

  return (
    <>
      <div className="space-y-4">
        {/* 星期標頭 */}
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="text-center text-xs font-bold pb-1" style={{ color: "#475569" }}>{d}</div>
          ))}
        </div>

        {/* 日期格 */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: startDow }).map((_, i) => <div key={`pad-${i}`} />)}

          {Array.from({ length: 28 }, (_, idx) => {
            const cellDate    = new Date(baseDay);
            cellDate.setDate(baseDay.getDate() + idx);
            const status      = getDayStatus(cellDate);
            const platforms   = schedule[idx] || [];
            const hasSchedule = platforms.length > 0;
            const isPast      = status === "past";

            return (
              <div key={idx}
                onClick={() => setPopup({ status, realDate: fmt(cellDate), dayNum: idx + 1, platforms })}
                style={{
                  ...CELL_STYLE[status](hasSchedule),
                  opacity: isPast ? 0.65 : 1,
                  borderRadius: "10px",
                  minHeight: "78px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                  padding: "8px 6px",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.opacity = "1";
                  el.style.boxShadow = "0 4px 12px rgba(15,23,42,0.10)";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.opacity = isPast ? "0.65" : "1";
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                <span className="text-[11px] font-bold leading-tight" style={{ color: DATE_COLOR[status] }}>
                  {fmt(cellDate)}
                </span>
                <span className="text-[9px] leading-none font-medium" style={{ color: isPast ? "#CBD5E1" : "#94A3B8" }}>
                  Day {idx + 1}
                </span>
                <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                  {platforms.slice(0, 2).map(p => <PlatformChip key={p} platform={p} status={status} />)}
                  {platforms.length > 2 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold"
                      style={{ background: "#E2E8F0", color: "#475569" }}>
                      +{platforms.length - 2}
                    </span>
                  )}
                </div>
                {status === "today" && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ background: "#3B82F6" }} />
                )}
                {status === "tomorrow" && hasSchedule && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ background: "#A855F7" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-5 pt-3" style={{ borderTop: "1px solid #E2E8F0" }}>
          {[
            { swatch: <span className="h-3 w-3 rounded-md inline-block" style={{ background: "#EFF6FF", border: "2px solid #3B82F6" }} />, label: "今天" },
            { swatch: <span className="h-3 w-3 rounded-md inline-block" style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", opacity: 0.65 }} />, label: "過去" },
            { swatch: <span className="h-3 w-3 rounded-md inline-block" style={{ background: "#FDF4FF", border: "1.5px solid #C084FC" }} />, label: "明日提醒" },
            { swatch: <span className="h-3 w-3 rounded-md inline-block" style={{ background: "#FFFFFF", border: "1px solid #BFDBFE" }} />, label: "排程中" },
            { swatch: <CheckCircle className="h-3 w-3 text-emerald-500" />, label: "已發布" },
          ].map(({ swatch, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#475569" }}>
              {swatch}{label}
            </div>
          ))}
        </div>

        {/* Platform legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {PLATFORMS.map(p => {
            const { label, hex } = PLATFORM_STYLE[p];
            return (
              <div key={p} className="flex items-center gap-1.5">
                <span style={{ background: hex }}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white">
                  {label}
                </span>
                <span className="text-xs font-semibold" style={{ color: "#334155" }}>{p}</span>
              </div>
            );
          })}
        </div>
      </div>

      {popup && <DayPopup data={popup} onClose={() => setPopup(null)} />}
    </>
  );
}
