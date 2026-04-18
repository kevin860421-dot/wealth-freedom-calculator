"use client";

import { useEffect, useState } from "react";
import { Globe, Clock, TrendingUp } from "lucide-react";

const STATS = [
  { icon: Globe,      label: "已發布平台數", value: "8",     sub: "FB · IG · Threads · LINE · Medium · 痞客邦 · Dcard · Mobile01", iconBg: "#DBEAFE", iconColor: "#1D4ED8" },
  { icon: Clock,      label: "預估節省時間", value: "42h",   sub: "本月自動改寫 × 20 篇",  iconBg: "#DCFCE7", iconColor: "#15803D" },
  { icon: TrendingUp, label: "本週總流量",   value: "2,841", sub: "較上週 +18%",             iconBg: "#FEF3C7", iconColor: "#B45309" },
];

function SkeletonCard() {
  return (
    <div className="p-5 space-y-3 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: "12px" }}>
      <div className="h-8 w-8 rounded-lg" style={{ background: "#F4F4F5" }} />
      <div className="h-3 w-24 rounded" style={{ background: "#F4F4F5" }} />
      <div className="h-7 w-16 rounded" style={{ background: "#F4F4F5" }} />
      <div className="h-2.5 w-40 rounded" style={{ background: "#F4F4F5" }} />
    </div>
  );
}

export function StatsCards() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 900); return () => clearTimeout(t); }, []);

  if (!loaded) return (
    <div className="grid grid-cols-3 gap-4">{STATS.map((_, i) => <SkeletonCard key={i} />)}</div>
  );

  return (
    <div className="grid grid-cols-3 gap-5">
      {STATS.map(({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
        <div key={label} className="p-6 space-y-3 transition-colors"
          style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px" }}>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: iconBg }}>
            <Icon className="h-4.5 w-4.5" style={{ color: iconColor }} />
          </div>
          <p className="text-sm font-bold" style={{ color: "#334155" }}>{label}</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: "#0F172A" }}>{value}</p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: "#64748B" }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}
