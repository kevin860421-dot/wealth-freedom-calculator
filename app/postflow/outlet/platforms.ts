/** 要發到各大部落格的隔離預覽。客戶端只引用這份清單，不讀稿。 */
export const BLOG_OUTLETS = [
  { key: "blog_blogger", label: "Blogger", color: "#FF5722" },
  { key: "blog_vocus", label: "方格子", color: "#F59E0B" },
  { key: "blog_pixnet", label: "痞客邦", color: "#FF6600" },
  { key: "blog_medium", label: "Medium", color: "#525252" },
] as const;

export type BlogOutletKey = (typeof BLOG_OUTLETS)[number]["key"];

export function isBlogOutletKey(value: string): value is BlogOutletKey {
  return BLOG_OUTLETS.some((item) => item.key === value);
}

export function blogOutletLabel(key: BlogOutletKey): string {
  return BLOG_OUTLETS.find((item) => item.key === key)?.label ?? key;
}
