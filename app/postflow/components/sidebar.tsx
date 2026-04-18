"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Library, CalendarClock, Settings, Zap, ChevronRight } from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "儀表板",    path: "/postflow"         },
  { icon: Library,         label: "母版內容庫", path: "/postflow/library", badge: "20" },
  { icon: CalendarClock,   label: "發布進度",  path: "/postflow/schedule" },
  { icon: Settings,        label: "帳號設定",  path: "/postflow/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col py-6"
      style={{ background: "#FFFFFF", borderRight: "1px solid #E2E8F0" }}>

      <div className="flex items-center gap-2 px-5 mb-10">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#3B82F6" }}>
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: "#0F172A" }}>PostFlow AI</span>
      </div>

      <nav className="flex-1 space-y-2 px-2">
        {NAV.map(({ icon: Icon, label, path, badge }) => {
          const isActive = pathname === path || (path !== "/postflow" && pathname.startsWith(path));
          return (
            <button key={path} onClick={() => router.push(path)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
              style={{
                background: isActive ? "#EFF6FF" : "transparent",
                color: isActive ? "#1D4ED8" : "#334155",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight className="h-3 w-3" style={{ color: "#93C5FD" }} />}
            </button>
          );
        })}
      </nav>

      <div className="px-5 pt-5" style={{ borderTop: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full" style={{ background: "linear-gradient(135deg,#93C5FD,#C4B5FD)" }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "#0F172A" }}>吳鎧全</p>
            <p className="truncate text-sm font-medium" style={{ color: "#64748B" }}>管理員</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
