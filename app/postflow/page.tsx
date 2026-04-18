"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bell, Search } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { StatsCards } from "./components/stats-cards";
import { PostCalendar } from "./components/post-calendar";
import { MasterEditor } from "./components/master-editor";

type Platform = "Blogger" | "FB" | "IG" | "Threads" | "Dcard" | "方格子" | "Mobile01" | "痞客邦" | "Medium";

const PLATFORM_STYLE: Record<Platform, { label: string; hex: string }> = {
  "Blogger":  { label: "B",  hex: "#FF5722" },
  "FB":       { label: "f",  hex: "#1877F2" },
  "IG":       { label: "ig", hex: "#C32AA3" },
  "Threads":  { label: "@",  hex: "#9E9FA0" },
  "Dcard":    { label: "D",  hex: "#EE4D5E" },
  "方格子":   { label: "方", hex: "#F59E0B" },
  "Mobile01": { label: "01", hex: "#EA580C" },
  "痞客邦":   { label: "痞", hex: "#FF6600" },
  "Medium":   { label: "M",  hex: "#525252" },
};

function PlatformAvatar({ platform }: { platform: Platform }) {
  const meta = PLATFORM_STYLE[platform] ?? { label: "?", hex: "#6B7280" };
  return (
    <span
      title={platform}
      style={{ background: meta.hex }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white -ml-1 first:ml-0 hover:scale-110 transition-transform text-[9px] font-bold text-white tracking-tight"
    >
      {meta.label}
    </span>
  );
}

export default function PostflowPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC", color: "#0F172A" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid #E2E8F0", background: "#FFFFFF" }}>
          <div>
            <h1 className="text-base font-bold" style={{ color: "#0F172A" }}>儀表板</h1>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Welcome back — PostFlow AI</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "#64748B" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Search className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "#64748B" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Bell className="h-4 w-4" />
            </button>
            <div className="relative">
              <span className="absolute inset-0 rounded-lg animate-ping opacity-25"
                style={{ background: "#3B82F6", animationDuration: "2s" }} />
              <button onClick={() => setEditorOpen(true)}
                className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                style={{ background: "#3B82F6" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#2563EB"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#3B82F6"; }}>
                <Plus className="h-3.5 w-3.5" />建立新母版文章
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8 max-w-6xl">

            <section>
              <h2 className="text-sm font-bold mb-4" style={{ color: "#0F172A" }}>概況</h2>
              <StatsCards />
            </section>

            <div className="grid grid-cols-3 gap-6">
              <section className="col-span-2 p-6 overflow-hidden"
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px" }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>28 天排程概覽</h2>
                  <span className="text-sm font-medium" style={{ color: "#475569" }}>
                    {new Date().getFullYear()} 年 {new Date().getMonth() + 1} 月
                  </span>
                </div>
                <PostCalendar startDate={(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; })()} />
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>快速操作</h2>
                <div className="p-5 space-y-4"
                  style={{ background: "#FFFFFF", border: "1px solid #BFDBFE", borderRadius: "14px" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#0F172A" }}>母版內容庫</p>
                      <p className="text-sm mt-0.5" style={{ color: "#475569" }}>共 20 篇文章</p>
                    </div>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: "#DBEAFE", color: "#1D4ED8" }}>20</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push("/postflow/library")}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-colors"
                      style={{ background: "#F1F5F9", color: "#334155" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E2E8F0"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}>
                      查看全部
                    </button>
                    <button onClick={() => router.push("/postflow/library")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition-colors"
                      style={{ background: "#3B82F6" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#2563EB"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#3B82F6"; }}>
                      <Plus className="h-3.5 w-3.5" />新建
                    </button>
                  </div>
                </div>
                {[{ label: "查看發布進度", desc: "28 天排程狀態", onClick: () => {} }].map(({ label, desc, onClick }) => (
                  <button key={label} onClick={onClick} className="w-full p-5 text-left transition-colors"
                    style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}>
                    <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{label}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#475569" }}>{desc}</p>
                  </button>
                ))}
              </section>
            </div>

            <section>
              <h2 className="text-sm font-bold mb-4" style={{ color: "#0F172A" }}>最近文章</h2>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                      {["文章標題", "發布平台", "排程日期", "狀態"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-sm font-bold"
                          style={{ color: "#334155" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: "二代健保補充保費完全攻略", platforms: ["FB", "Medium", "痞客邦"] as Platform[], date: "2026/04/18", status: "待發布" },
                      { title: "54C 股利抵減怎麼算？",     platforms: ["Threads", "Dcard", "方格子"] as Platform[], date: "2026/04/15", status: "已發布" },
                      { title: "ETF 定期定額 5 年試算",     platforms: ["IG", "Blogger", "Mobile01"] as Platform[], date: "2026/04/12", status: "已發布" },
                    ].map((row, i) => (
                      <tr key={row.title} className="cursor-pointer transition-colors"
                        style={{ borderTop: i > 0 ? "1px solid #E2E8F0" : "none", background: "#FFFFFF" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}>
                        <td className="px-5 py-4 text-sm font-semibold" style={{ color: "#0F172A" }}>{row.title}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center pl-1">
                            {row.platforms.map(p => <PlatformAvatar key={p} platform={p} />)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium" style={{ color: "#475569" }}>{row.date}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                            style={row.status === "已發布"
                              ? { background: "#DCFCE7", color: "#15803D" }
                              : { background: "#FEF9C3", color: "#A16207" }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>

      <MasterEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
