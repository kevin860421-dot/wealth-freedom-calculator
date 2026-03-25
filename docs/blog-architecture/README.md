# 部落格架構（可複用藍圖）

本資料夾描述 **財富自由計算機** 內「第一篇＋第二篇」實作所歸納出的 **Next.js App Router 部落格架構**。之後新文章或新專案要對齊同一套做法時，在 Cursor 可說：**「用部落格架構生成」**（會對應專案內 Skill：`taiwan-seo-blog-architecture`）。

## 快速連結

| 文件 | 用途 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 目錄樹、責任分工、新增文章檢查清單、兩種互動版型 |
| 參考實作 | `app/blog/posts/registry.ts`、`app/blog/2026-dividend-tax-guide/`、`app/blog/tax-overpay-blind-spot/` |
| 維運摘要 | [../BLOG-POSTS.md](../BLOG-POSTS.md) |

## 架構一句話

**`registry.ts` 為單一真相來源**（slug、排程、列表與首頁露出）；每篇文章一個 **`app/blog/<slug>/page.tsx`**；排程未到則全站隱藏 + `noindex`；**sitemap** 與 **首頁 Hero／Footer** 皆讀 registry，無需手動加 URL。

**慣例摘要**：每篇**至少一項**讀者可操作的互動；正文**僅一顆**「前往財富自由計算機」主按鈕（`blog-calculator-cta.ts` 錨點），捲動彩蛋只捲到該按鈕、不再各放一顆首頁連結。細節見 [ARCHITECTURE.md](./ARCHITECTURE.md)。
