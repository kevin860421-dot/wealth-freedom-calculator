# 部落格文章與排程公開

- **登錄表**：`app/blog/posts/registry.ts`  
  所有文章的 `slug`、`publishAtIso`、列表文案、首頁是否露出，都在此維護。

- **未到 `publishAtIso`**：列表不列、sitemap 不含、首頁捷徑不顯示、直接開網址為「準備中」頁（`BlogScheduledPlaceholder`）、`noindex`。

- **新增文章**：見 `registry.ts` 檔頭註解；並新增 `app/blog/<slug>/page.tsx`，內文邏輯請比照 `app/blog/2026-dividend-tax-guide/page.tsx`。
