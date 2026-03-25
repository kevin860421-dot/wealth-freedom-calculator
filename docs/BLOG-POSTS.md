# 部落格文章與排程公開

完整可複用藍圖（目錄樹、檢查清單、互動版型、單一主 CTA）：[blog-architecture/README.md](./blog-architecture/README.md)。

- **登錄表**：`app/blog/posts/registry.ts`  
  所有文章的 `slug`、`publishAtIso`、列表文案、首頁是否露出，都在此維護。

- **未到 `publishAtIso`**：列表不列、sitemap 不含、首頁捷徑不顯示、直接開網址為「準備中」頁（`BlogScheduledPlaceholder`）、`noindex`。

- **新增文章**：見 `registry.ts` 檔頭註解；並新增 `app/blog/<slug>/page.tsx`，內文邏輯請比照 `app/blog/2026-dividend-tax-guide/page.tsx` 或 `app/blog/tax-overpay-blind-spot/page.tsx`。

現有文章：

| slug | 資料夾 |
|------|--------|
| `household-dividend-tax-checklist` | 存股節稅（5） |
| `etf-dividend-54c-structure` | 存股節稅（4） |
| `passive-income-fire-blueprint` | 存股節稅（3） |
| `tax-overpay-blind-spot` | 存股節稅（2） |
| `2026-dividend-tax-guide` | 存股節稅（1） |

## 本機預覽（排程未到也想看內容）

專案根目錄 `.env.local` 新增一行：

```env
NEXT_PUBLIC_BLOG_PREVIEW_ALL=true
```

重新執行 `npm run dev` 後，開發環境會**忽略** `publishAtIso`，列表與文章全文皆可預覽。  
**勿在 Vercel Production 環境變數開啟**（且 production 下程式也不會套用此略過邏輯）。
