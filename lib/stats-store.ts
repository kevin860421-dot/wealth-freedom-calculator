import fs from "fs";
import path from "path";

/** 月分鍵 YYYY-MM */
export type StatsMonthKey = string;

export type PublicStats = {
  monthKey: StatsMonthKey;
  /** 本月「工作階段」瀏覽次數（每 session 最多計 1，由前端配合 sessionStorage） */
  monthPageViews: number;
  /** 本月「有效互動」次數（停留／下載／編輯輸入，每 session 最多 1） */
  monthEngagement: number;
  /** 自啟用以來總瀏覽（工作階段） */
  totalPageViews: number;
  /** 自啟用以來總有效互動 */
  totalEngagement: number;
  updatedAt: string;
};

type FileShape = {
  monthPageViews: Record<string, number>;
  monthEngagement: Record<string, number>;
  totalPageViews: number;
  totalEngagement: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "stats.json");

function monthKeyNow(): StatsMonthKey {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function emptyShape(): FileShape {
  return {
    monthPageViews: {},
    monthEngagement: {},
    totalPageViews: 0,
    totalEngagement: 0,
  };
}

function load(): FileShape {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyShape();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<FileShape>;
    return {
      monthPageViews: typeof parsed.monthPageViews === "object" && parsed.monthPageViews !== null ? parsed.monthPageViews : {},
      monthEngagement: typeof parsed.monthEngagement === "object" && parsed.monthEngagement !== null ? parsed.monthEngagement : {},
      totalPageViews: Number(parsed.totalPageViews) || 0,
      totalEngagement: Number(parsed.totalEngagement) || 0,
    };
  } catch {
    return emptyShape();
  }
}

function save(data: FileShape): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.error("[stats-store] save failed:", e);
  }
}

function toPublic(data: FileShape): PublicStats {
  const mk = monthKeyNow();
  return {
    monthKey: mk,
    monthPageViews: data.monthPageViews[mk] ?? 0,
    monthEngagement: data.monthEngagement[mk] ?? 0,
    totalPageViews: data.totalPageViews,
    totalEngagement: data.totalEngagement,
    updatedAt: new Date().toISOString(),
  };
}

/** 供 Server Component／GET 讀取（不遞增） */
export function getPublicStatsSnapshot(): PublicStats {
  return toPublic(load());
}

export function incrementPageView(): PublicStats {
  const data = load();
  const mk = monthKeyNow();
  data.monthPageViews[mk] = (data.monthPageViews[mk] ?? 0) + 1;
  data.totalPageViews += 1;
  save(data);
  return toPublic(data);
}

export function incrementEngagement(): PublicStats {
  const data = load();
  const mk = monthKeyNow();
  data.monthEngagement[mk] = (data.monthEngagement[mk] ?? 0) + 1;
  data.totalEngagement += 1;
  save(data);
  return toPublic(data);
}
