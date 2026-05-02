"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Library, CalendarClock, Settings, Zap, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type React from "react";

const NAV = [
  { icon: LayoutDashboard, label: "儀表板",    path: "/postflow"         },
  { icon: Library,         label: "母版內容庫", path: "/postflow/library", badge: "20" },
  { icon: CalendarClock,   label: "發布進度",  path: "/postflow/schedule" },
  { icon: Settings,        label: "帳號設定",  path: "/postflow/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [platformExpanded, setPlatformExpanded] = useState(true);
  const [mobile01Expanded, setMobile01Expanded] = useState(true);

  const mobile01Items = useMemo(
    () => [
      { label: "Mobile01 閒聊趣味", key: "mobile01-master", isMaster: true as const },
      { label: "Mobile01 理財", key: "finance" },
      { label: "Mobile01 職場甘苦談", key: "career" },
      { label: "Mobile01 創業夢想家", key: "startup" },
      { label: "Mobile01 其他應用軟體", key: "apps" },
      { label: "Mobile01 AI 人工智慧", key: "ai" },
    ],
    [],
  );

  const platformItems = useMemo(
    () => [
      { label: "Threads", key: "threads" },
      { label: "Facebook", key: "fb" },
      { label: "Instagram", key: "ig" },
      { label: "Dcard", key: "dcard" },
      { label: "方格子", key: "vocus" },
      { label: "痞客邦", key: "pixnet" },
      { label: "Blogger", key: "blogger" },
      { label: "Medium", key: "medium" },
    ],
    [],
  );

  const subBtnClass = "w-full rounded-md px-2 py-2 text-left text-[12px] font-semibold transition-colors";
  const subBtnStyle = { color: "#475569" } as const;
  const subBtnHoverOn = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLElement).style.background = "#F8FAFC";
  };
  const subBtnHoverOff = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLElement).style.background = "transparent";
  };

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
          const isLibrary = path === "/postflow/library";
          return (
            <div key={path}>
              <button
                onClick={() => {
                  if (isLibrary) setLibraryExpanded((v) => !v);
                  router.push(path);
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
                style={{
                  background: isActive ? "#EFF6FF" : "transparent",
                  color: isActive ? "#1D4ED8" : "#334155",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badge && (
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                  >
                    {badge}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3 w-3" style={{ color: "#93C5FD" }} />}
              </button>

              {isLibrary && libraryExpanded && (
                <div className="pl-9 pr-2 pb-1 -mt-1 space-y-1">
                  {/* 各平台（入口） */}
                  <button
                    type="button"
                    onClick={() => setPlatformExpanded((v) => !v)}
                    className={subBtnClass}
                    style={subBtnStyle}
                    onMouseEnter={subBtnHoverOn}
                    onMouseLeave={subBtnHoverOff}
                  >
                    各平台
                  </button>

                  {platformExpanded && (
                    <div className="space-y-1 pl-2">
                      {platformItems.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => router.push(`/postflow/library?platform=${encodeURIComponent(p.key)}`)}
                          className={subBtnClass}
                          style={subBtnStyle}
                          onMouseEnter={subBtnHoverOn}
                          onMouseLeave={subBtnHoverOff}
                        >
                          {p.label}
                        </button>
                      ))}

                      {/* Mobile01（可展開：6 分類 + Mobile01 母版） */}
                      <button
                        type="button"
                        onClick={() => setMobile01Expanded((v) => !v)}
                        className={subBtnClass}
                        style={subBtnStyle}
                        onMouseEnter={subBtnHoverOn}
                        onMouseLeave={subBtnHoverOff}
                      >
                        Mobile01
                      </button>
                      {mobile01Expanded && (
                        <div className="space-y-1 pl-2">
                          {mobile01Items.map((it) => (
                            <button
                              key={it.key}
                              type="button"
                              onClick={() =>
                                router.push(
                                  it.isMaster
                                    ? "/postflow/library?view=mobile01-master"
                                    : `/postflow/library?mobile01=${encodeURIComponent(it.key)}`,
                                )
                              }
                              className={subBtnClass}
                              style={subBtnStyle}
                              onMouseEnter={subBtnHoverOn}
                              onMouseLeave={subBtnHoverOff}
                            >
                              {it.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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
