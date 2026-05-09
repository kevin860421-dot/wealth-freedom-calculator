/**
 * quick-11 介面色票（與設計表對齊）
 * Light：底 #FFF、卡片 #F2F2F7、輸入 #FFF、主字 #1C1C1E、次字 #636366、強調 #A2CC00、線 #E5E5EA、影 rgba(0,0,0,.05)
 * Dark：底 #000、卡片 #1C1C1E、輸入 #2C2C2E、主字 #FFF、次字 #8E8E93、強調 #CCFF00、線 #38383A、無投影
 */
export const Q11 = {
  light: {
    bg: "#FFFFFF",
    card: "#F2F2F7",
    input: "#FFFFFF",
    text: "#1C1C1E",
    muted: "#636366",
    accent: "#A2CC00",
    border: "#E5E5EA",
    shadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
  },
  dark: {
    bg: "#000000",
    card: "#1C1C1E",
    input: "#2C2C2E",
    text: "#FFFFFF",
    muted: "#8E8E93",
    accent: "#CCFF00",
    border: "#38383A",
    shadow: "none",
  },
} as const;
