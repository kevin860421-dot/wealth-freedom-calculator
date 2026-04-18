/** 本機素材資料夾（複製路徑／嘗試開啟檔案總管用） */
export const SHARE_IMAGE_FOLDER_ABS =
  "D:\\吳鎧全的資料\\73_Qian Duan Program\\02_The Wealth Freedom Computer (Article)\\01_素材\\01_貼文\\01_圖片\\01_分享圖";

/** 網站 public 對應檔名（請將 07/09/10/11 圖檔放進 public/postflow-share/） */
export const SHARE_ASSET_PUBLIC = {
  cover: [{ file: "07.png", label: "封面", alt: "封面" }],
  screenshot: [
    { file: "09.png", label: "截圖 1", alt: "截圖一" },
    { file: "10.png", label: "截圖 2", alt: "截圖二" },
  ],
  result: [{ file: "11.png", label: "結果", alt: "結果" }],
} as const;

export type ShareAssetKind = keyof typeof SHARE_ASSET_PUBLIC;

export function publicUrlForShareFile(file: string) {
  return `/postflow-share/${file}`;
}

export function markdownForShareFiles(kind: ShareAssetKind, origin: string): string {
  const base = origin.replace(/\/$/, "");
  const blocks: string[] = [];
  for (const item of SHARE_ASSET_PUBLIC[kind]) {
    const url = `${base}${publicUrlForShareFile(item.file)}`;
    blocks.push(`![${item.alt}](${url})`);
  }
  return `\n\n${blocks.join("\n\n")}\n\n`;
}

/** 單一分享圖檔 → Markdown（供各預覽列「加入文章」） */
export function markdownForSingleShareFile(file: string, alt: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  const url = `${base}${publicUrlForShareFile(file)}`;
  return `\n\n![${alt}](${url})\n\n`;
}

/** Windows 絕對路徑 → file:// URL（僅部分瀏覽器允許開啟） */
export function tryFileUrlFromWindowsPath(abs: string): string | null {
  const norm = abs.trim().replace(/\\/g, "/");
  const m = norm.match(/^([A-Za-z]):\/?(.*)$/);
  if (!m) return null;
  const rest = m[2]
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `file:///${m[1]}:/${rest}/`;
}
