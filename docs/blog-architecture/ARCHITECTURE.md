# 部落格架構詳解

適用：**Next.js App Router**、繁中 SEO 長文 + 可選互動元件、**定時公開**（`publishAtIso`）。

## 目錄樹（`app/blog/`）

```
app/blog/
├── layout.tsx                    # 部落格區塊外殼（全站風格 + BlogMoneyEatenSplash）
├── page.tsx                      # /blog 列表（僅已公開文章）
├── blog.module.css               # 列表與文章共用版面類別
├── posts/
│   └── registry.ts               # ★ 單一真相：slug、時間、列表文案、首頁露出
├── article-publish-stamp.tsx     # 公開後顯示發佈時間（+ module.css）
├── blog-scheduled-placeholder.tsx
├── blog-money-eaten-splash.tsx   # 進入部落格可選小互動
├── blog-calculator-cta.ts        # 主 CTA 錨點 id + scrollTo（全站約定）
├── calculator-hero-preview.tsx   # 首頁 hero 三欄示意（多篇共用）
├── blog-calculator-snippet-duo.tsx # 第四／五篇：雙張「試算表摘錄」示意（非第一篇版型）
│
├── 【第一篇專屬互動】
├── dividend-tax-interactive.tsx / .module.css
├── tax-bracket-compare-chart.tsx / .module.css
├── blog-scroll-milestone-modal.tsx
│
├── 【第二篇專屬互動】
├── blog-overpay-quiz.tsx / .module.css
├── blog-nhi2-compare.tsx / .module.css
├── blog-tax-leak-meter.tsx / .module.css
├── blog-case-gap-bars.tsx / .module.css
├── blog-punchline-slide-strip.tsx / .module.css  # 含 BlogPunchlineEndGate
├── blog-three-lever-sandbox.tsx / .module.css   # 第三篇：三槓桿沙盒
├── blog-fire-readiness-checklist.tsx / .module.css
├── blog-etf-54c-composition.tsx / .module.css   # 第四篇：54C／平準金示意
├── blog-household-dividend-panel.tsx / .module.css # 第五篇：合併申報情境
│
├── household-dividend-tax-checklist/
│   └── page.tsx                  # 第五篇（家庭申報；捲動里程碑 Modal）
├── etf-dividend-54c-structure/
│   └── page.tsx                  # 第四篇（ETF 配息組成；捲動里程碑 Modal）
├── passive-income-fire-blueprint/
│   └── page.tsx                  # 第三篇（專業／導流；捲動里程碑 Modal）
├── 2026-dividend-tax-guide/
│   └── page.tsx                  # 第一篇（範例 A：捲動里程碑 Modal）
└── tax-overpay-blind-spot/
    └── page.tsx                  # 第二篇（捲動里程碑 Modal，與第一篇同款）
```

## 站內整合點（勿漏改）

| 位置 | 行為 |
|------|------|
| `app/blog/posts/registry.ts` | 新增 `BlogPostRegistryEntry`；新文建議放在陣列**上方**（列表順序） |
| `app/blog/<slug>/page.tsx` | `SLUG` 與資料夾名、registry 一致；`generateMetadata` 未公開時 `robots: noindex` |
| `app/sitemap.ts` | 已使用 `getPublishedBlogPosts()`，**通常不必改** |
| `app/page.tsx` | 已使用 `getHomeHeroBlogPosts` / `getHomeFooterBlogPosts`，由 registry 旗標控制 |

## 排程與預覽

- **未到 `publishAtIso`**：`/blog` 不列、sitemap 不含、首頁捷徑不顯示、直開 `/blog/<slug>` 為準備中頁。
- **本機預覽全文**：`.env.local` 設 `NEXT_PUBLIC_BLOG_PREVIEW_ALL=true`（僅 development）。詳見 `docs/BLOG-POSTS.md`。

## 主 CTA（前往財富自由計算機）— 每篇僅一顆

- 文章**正文**裡，指向首頁計算機的 **`styles.cta` 主按鈕只能有一個**：`<Link href="/" className={styles.cta} target="_blank" rel="noopener noreferrer" id={WF_BLOG_CALCULATOR_CTA_ID}>`，常數見 `app/blog/blog-calculator-cta.ts`（`WF_BLOG_CALCULATOR_CTA_ID`）。
- **`BlogScrollMilestoneModal`**、**`BlogPunchlineSlideStrip`** 等彩蛋／底部條**不得**再各放一顆連到 `/` 的連結；改為**按鈕**呼叫 `scrollToBlogCalculatorCta()`，把讀者帶到上文那顆主按鈕（再自行點開新分頁）。
- `CalculatorHeroPreview` 僅示意版面，**不算** CTA。`/blog` 列表的「回到計算機」、準備中頁的連結屬導覽，不在此限。

## 互動元件（必備）

- **每篇文章至少一項**讀者可操作的互動（`"use client"` 元件）：例如滑桿、選擇題、可拖數值、動畫長條、圖表、捲動觸發模組等；純長文不算過關。
- **選題與算法**：可由 AI **上網查證**當年度法規、稅率、門檻、官方用語，或依主題**自行發想**合適的隱喻／試算；須與文旨一致，且教學數字旁保留**免責**與「僅供理解、非報稅建議」語氣（比照現有兩篇）。
- 互動程式放在 `app/blog/blog-*.tsx`（+ `.module.css`），由該篇 `page.tsx` 引用；複雜邏輯可抽到 `lib/`，但 UI 仍歸在 `blog/` 以利維護。

## 單篇文章 `page.tsx` 慣例（兩篇共通）

1. `export const dynamic = "force-dynamic"`（與現有一致，避免快取與「現在時間」不一致）。
2. `const SLUG = "..." as const`，`getBlogPostBySlug(SLUG)`，缺漏則 `throw`（建錯早失敗）。
3. `generateMetadata()`：未公開 → 短 title + `noindex`；已公開 → 完整 `title` / `description` / `keywords` / `openGraph` / `twitter` / `canonical`。
4. 內文：未公開 render `<BlogScheduledPlaceholder publishAtIso={...} />`；已公開 render 內容 + `<ArticlePublishStamp publishAtIso={entry.publishAtIso} />`。
5. 可選：`articleJsonLd()`（Article / BreadcrumbList）— 複製任一篇的結構再改文案與 URL。
6. 文內可放 `CalculatorHeroPreview`（示意）；**主 CTA** 依「每篇僅一顆」規則，並設 `id={WF_BLOG_CALCULATOR_CTA_ID}`。
7. 至少一項互動元件（見上節）。

**對照檔案：**

- 第一篇：`app/blog/2026-dividend-tax-guide/page.tsx`
- 第二篇：`app/blog/tax-overpay-blind-spot/page.tsx`
- 第三篇：`app/blog/passive-income-fire-blueprint/page.tsx`
- 第四篇：`app/blog/etf-dividend-54c-structure/page.tsx`
- 第五篇：`app/blog/household-dividend-tax-checklist/page.tsx`

## 兩種「長文互動」版型（新文擇一或自創）

| 版型 | 代表文章 | 元件 | 用途 |
|------|----------|------|------|
| **A｜捲動里程碑** | 第一篇 | `BlogScrollMilestoneModal` + `SCROLL_MILESTONE_SESSION_KEY` | 捲到某段跳出一次性 Modal |
| **B｜結尾 punchline 滑軌** | （可選） | `blog-punchline-slide-strip` 的 `BlogPunchlineEndGate` | 讀到底再展開底部條；第二篇已改與首篇相同之捲動 Modal |

新文若互動邏輯不同：在 `app/blog/` 新增 `blog-*.tsx` + `.module.css`，**不要**把長文塞進單一巨型檔案；保持與 `blog.module.css` 風格變數一致（`--morandi-*`）。

## 新增文章檢查清單

- [ ] `registry.ts` 新增一筆（slug、publishAtIso、listTitle、listDescription、featureHomeHero / featureHomeFooter）
- [ ] 新建 `app/blog/<slug>/page.tsx`（SLUG、metadata、placeholder、JSON-LD）
- [ ] **至少一項**互動：`blog-*.tsx`（+ CSS）或沿用版型；題材可查證或自創，附免責
- [ ] **正文僅一顆**主 CTA：`id={WF_BLOG_CALCULATOR_CTA_ID}`；Modal／底部條只捲動至錨點
- [ ] 本機 `npm run dev` + 必要時 `NEXT_PUBLIC_BLOG_PREVIEW_ALL=true` 驗證
- [ ] `npm run build` 確認通過

## 與「另一個全新專案」的關係

若要整包搬到別的 repo：至少需帶走 **`app/blog/` 整樹**、**`app/sitemap.ts` 內 blog 相關 import**、**首頁對 registry 的引用**，以及全站 **CSS 變數／主題**（莫蘭迪深色）才能維持視覺一致；其餘可依新產品刪減 CTA（例如 `CalculatorHeroPreview`）。
