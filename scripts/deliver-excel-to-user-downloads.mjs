/**
 * 產生 Excel 後，複製一份到使用者「下載」資料夾（預設 D:\下載）。
 * 可覆寫：環境變數 EXCEL_USER_DOWNLOADS_DIR
 */
import fs from "fs";
import path from "path";

/** 專案慣例：使用者 Windows 下載資料夾 */
export const DEFAULT_USER_DOWNLOADS_DIR = "D:\\下載";

export function resolveUserDownloadsDir() {
  const fromEnv = process.env.EXCEL_USER_DOWNLOADS_DIR?.trim();
  if (fromEnv) return fromEnv;

  if (fs.existsSync(DEFAULT_USER_DOWNLOADS_DIR)) return DEFAULT_USER_DOWNLOADS_DIR;

  const userProfile = process.env.USERPROFILE;
  if (userProfile) {
    const fallback = path.join(userProfile, "Downloads");
    if (fs.existsSync(fallback)) return fallback;
    const fallbackZh = path.join(userProfile, "下載");
    if (fs.existsSync(fallbackZh)) return fallbackZh;
  }

  return DEFAULT_USER_DOWNLOADS_DIR;
}

/**
 * @param {string} sourceFile - 已產生的 .xlsx 絕對或相對路徑
 * @param {string} [destFileName] - 下載資料夾內檔名；預設沿用來源檔名
 * @returns {string | null} 複製後的完整路徑；失敗回傳 null
 */
export function deliverExcelToUserDownloads(sourceFile, destFileName) {
  const src = path.resolve(sourceFile);
  if (!fs.existsSync(src)) {
    console.warn("[deliver-excel] 找不到來源檔：", src);
    return null;
  }

  const dir = resolveUserDownloadsDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn("[deliver-excel] 無法建立下載資料夾：", dir, err.message);
    return null;
  }

  const baseName = destFileName ?? path.basename(src);
  const ext = path.extname(baseName);
  const stem = baseName.slice(0, -ext.length);

  /** 目標檔被 Excel 開啟時，改存 -v2、-v3… 新檔 */
  const candidateNames = [baseName];
  for (let i = 2; i <= 30; i += 1) {
    candidateNames.push(`${stem}-v${i}${ext}`);
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  candidateNames.push(`${stem}-${stamp}${ext}`);

  let lastErr = null;
  for (const name of candidateNames) {
    const dest = path.join(dir, name);
    try {
      fs.copyFileSync(src, dest);
      if (name !== baseName) {
        console.log("[deliver-excel] 原檔被占用，已改存新版本 →", dest);
      } else {
        console.log("[deliver-excel] 已複製到下載資料夾 →", dest);
      }
      return dest;
    } catch (err) {
      lastErr = err;
      if (err.code === "EBUSY" || err.code === "EPERM" || err.code === "EACCES") continue;
      console.warn("[deliver-excel] 複製失敗：", dest);
      console.warn(err.message);
      return null;
    }
  }

  console.warn("[deliver-excel] 所有檔名皆無法寫入（請關閉 Excel 後重試）：", path.join(dir, baseName));
  if (lastErr) console.warn(lastErr.message);
  return null;
}
