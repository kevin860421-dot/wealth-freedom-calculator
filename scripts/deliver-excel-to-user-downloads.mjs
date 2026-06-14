/**
 * 產生 Excel 後，複製到使用者下載資料夾（固定 D:\下載）。
 * 可覆寫：環境變數 EXCEL_USER_DOWNLOADS_DIR
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/** 使用者指定：唯一交付路徑 */
export const DEFAULT_USER_DOWNLOADS_DIR = "D:\\下載";

export const QUICK11_USER_XLSX = "quick11-home-v5-dual-sheets.xlsx";
export const QUICK11_USER_XLSM = "quick11-home-v5-dual-sheets.xlsm";

export function resolveUserDownloadsDir() {
  const fromEnv = process.env.EXCEL_USER_DOWNLOADS_DIR?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_USER_DOWNLOADS_DIR;
}

/** 刪除 D:\下載 內多餘 quick11 檔（-v2、舊檔名等） */
export function cleanupQuick11UserDownloads(options = {}) {
  const dir = resolveUserDownloadsDir();
  if (!fs.existsSync(dir)) return { removed: [], kept: [] };

  const preferXlsm = options.preferXlsm === true;
  const keep = new Set([QUICK11_USER_XLSM]);
  if (!preferXlsm) keep.add(QUICK11_USER_XLSX);

  const removed = [];
  const kept = [];

  for (const name of fs.readdirSync(dir)) {
    if (!/^quick11/i.test(name)) continue;
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) continue;

    if (keep.has(name)) {
      kept.push(full);
      continue;
    }

    try {
      fs.unlinkSync(full);
      removed.push(full);
    } catch (err) {
      console.warn("[deliver-excel] 無法刪除：", full, err.message);
    }
  }

  if (removed.length) {
    console.log("[deliver-excel] 已清理 D:\\下載 多餘 quick11 檔 →", removed.length, "個");
  }
  return { removed, kept };
}

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
    console.warn("[deliver-excel] 無法建立資料夾：", dir, err.message);
    return null;
  }

  const baseName = destFileName ?? path.basename(src);
  const dest = path.join(dir, baseName);

  try {
    fs.copyFileSync(src, dest);
    console.log("[deliver-excel] 已複製 →", dest);
    return dest;
  } catch (err) {
    if (err.code === "EBUSY" || err.code === "EPERM" || err.code === "EACCES") {
      console.warn("[deliver-excel] 無法寫入（請關閉 Excel）：", dest);
    } else {
      console.warn("[deliver-excel] 複製失敗：", dest, err.message);
    }
    return null;
  }
}

export function deliverQuick11ToUserDownloads({ xlsxPath, xlsmPath = null }) {
  cleanupQuick11UserDownloads({ preferXlsm: false });

  if (!fs.existsSync(xlsxPath)) {
    console.warn("[deliver-excel] 找不到 xlsx：", xlsxPath);
    return { primary: null, xlsx: null, xlsm: null };
  }

  const xlsxStat = fs.statSync(xlsxPath);
  let useXlsm = false;
  if (xlsmPath && fs.existsSync(xlsmPath)) {
    useXlsm = fs.statSync(xlsmPath).mtimeMs >= xlsxStat.mtimeMs;
    if (!useXlsm) {
      console.warn(
        "[deliver-excel] xlsm 比 xlsx 舊，先交付 xlsx；請重跑 generate:quick11-excel-spinners",
      );
    }
  }

  const dir = resolveUserDownloadsDir();

  if (useXlsm && xlsmPath) {
    const xlsmDest = deliverExcelToUserDownloads(xlsmPath, QUICK11_USER_XLSM);
    if (xlsmDest) {
      const redundant = path.join(dir, QUICK11_USER_XLSX);
      try {
        if (fs.existsSync(redundant)) fs.unlinkSync(redundant);
      } catch {
        console.warn("[deliver-excel] 請手動刪除：", redundant);
      }
      cleanupQuick11UserDownloads({ preferXlsm: true });
      return { primary: xlsmDest, xlsx: null, xlsm: xlsmDest };
    }
  }

  const xlsxDest = deliverExcelToUserDownloads(xlsxPath, QUICK11_USER_XLSX);
  const staleXlsm = path.join(dir, QUICK11_USER_XLSM);
  try {
    if (fs.existsSync(staleXlsm)) fs.unlinkSync(staleXlsm);
  } catch {
    console.warn("[deliver-excel] 請手動刪除過期 xlsm：", staleXlsm);
  }
  cleanupQuick11UserDownloads({ preferXlsm: false });
  return { primary: xlsxDest, xlsx: xlsxDest, xlsm: null };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const root = path.join(import.meta.dirname, "..");
  const defaultXlsx = path.join(root, "assets", "downloads", "quick11-loan-dti-template.xlsx");
  const defaultXlsm = path.join(root, "assets", "downloads", "quick11-loan-dti-template.xlsm");

  const xlsxPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultXlsx;
  const xlsmPath = fs.existsSync(defaultXlsm) ? defaultXlsm : null;

  const result = deliverQuick11ToUserDownloads({ xlsxPath, xlsmPath });
  if (!result.primary) {
    process.exitCode = 1;
  } else {
    console.log("[deliver-excel] 請開啟 →", result.primary);
  }
}
