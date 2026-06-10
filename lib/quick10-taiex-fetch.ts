/** 加權指數抓不到時的預設錨點（與 quick-10 logic 一致） */
export const DEFAULT_TAIEX_INDEX = 38_926;

const TWSE_MIS_URL =
  "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_t00.tw&json=1&delay=0";

type TwseMisRow = {
  z?: string;
  y?: string;
  d?: string;
};

type TwseMisPayload = {
  rtcode?: string;
  msgArray?: TwseMisRow[];
};

export type TaiexQuote = {
  index: number;
  tradeDate: string | null;
  source: "twse-mis" | "fallback";
  fetchedAt: string;
};

function parseIndex(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/** 向證交所 MIS 取得加權指數（免費、無 API Key） */
export async function fetchTaiexFromTwse(): Promise<TaiexQuote> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(TWSE_MIS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WealthFreedomCalculator/1.0)",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`TWSE HTTP ${res.status}`);
    const json = (await res.json()) as TwseMisPayload;
    if (json.rtcode !== "0000" || !json.msgArray?.length) {
      throw new Error("TWSE empty payload");
    }
    const row = json.msgArray[0];
    const index = parseIndex(row.z) ?? parseIndex(row.y);
    if (index == null) throw new Error("TWSE parse failed");
    const tradeDate = row.d?.length === 8 ? row.d : null;
    return { index, tradeDate, source: "twse-mis", fetchedAt };
  } catch {
    return {
      index: DEFAULT_TAIEX_INDEX,
      tradeDate: null,
      source: "fallback",
      fetchedAt,
    };
  }
}
