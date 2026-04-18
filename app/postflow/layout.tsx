import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PostFlow AI",
  description: "多平台內容發布管理儀表板",
  icons: { icon: "/postflow-icon.png", apple: "/postflow-icon.png" },
};

export default function PostflowLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .pf-root *, .pf-root *::before, .pf-root *::after { box-sizing: border-box; }
        .pf-root { font-size: 14px; }
        .pf-root input, .pf-root textarea, .pf-root select, .pf-root button {
          border: none; outline: none; background: transparent;
          font-family: inherit; font-size: inherit; color: inherit;
          padding: 0; margin: 0; -webkit-appearance: none; appearance: none;
        }
        .pf-root input:focus, .pf-root textarea:focus { outline: none; box-shadow: none; }
        .pf-root input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0) opacity(0.4); cursor: pointer; }
        .pf-root ::-webkit-scrollbar { width: 8px; height: 8px; }
        .pf-root ::-webkit-scrollbar-track { background: #F1F5F9; }
        .pf-root ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
        .pf-root ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>
      <div className="pf-root antialiased"
        style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", background: "#F8FAFC", color: "#0F172A" }}>
        {children}
      </div>
    </>
  );
}
