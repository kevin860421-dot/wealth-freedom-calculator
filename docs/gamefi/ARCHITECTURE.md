# 73 財富自由計算機 — GameFi 系統架構與自動化驗證規範

> **73 Wealth Calculator — GameFi Architecture & Self-Verification Spec**

---

## AI 協作提示詞（複製使用）

```
請先閱讀 docs/gamefi/ARCHITECTURE.md 架構文件。
我需要你幫我寫 [某功能]（例如：抽卡 API）。
在完成程式碼後，請自動執行 scripts/verify-bounds.js 與 E2E 測試來進行自我驗證，
並在對話中向我回報驗證結果（確認核心計算機未被破壞、專案編譯成功且資料庫測試通過），
才可以交付程式碼。
```

建議交付前在本機執行：

```bash
node scripts/check-env.js
npm run verify:gamefi
```

`verify:gamefi` 執行升級版 `verify-bounds.js`（邊界 + 前端 Prisma/OAuth 檢查 + build）。完整 DB E2E 用 `npm run verify:gamefi:full`。

---

## 1. 系統邊界與防護原則（System Boundary）

GameFi 模組（用戶錢包、抽卡、下注）**不得侵入**財富自由計算機核心。AI 與開發者必須遵守：

### 🚫 絕對不可觸碰的計算器核心檔案

| 檔案 / 目錄 | 說明 |
|-------------|------|
| `app/page.tsx` | 首頁計算機路由 |
| `app/home-client-page.tsx` | 首頁計算機 UI 主體 |
| `lib/home-simulation-engine.ts` | 首頁試算核心 |
| `lib/home-simulation.worker.ts` | Web Worker 試算 |
| `lib/calculator-persistence.ts` | localStorage 持久化 |
| `lib/table-calculator.ts` | 表格試算 |
| `lib/dividend-tax-sandbox.ts` | 股利稅試算 |
| `lib/home-tax-nhi-shared.ts` | 稅費共用邏輯 |
| `app/quick-*/logic.ts` | 各 quick 計算機邏輯 |
| `app/blog/**` | 部落格系統 |
| `data/stats.json` | 站點統計 |

> 本專案**沒有** `components/calculator/` 目錄；邊界以 `scripts/verify-bounds.js` 內清單為準。

### 📂 GameFi 專屬掛載點（Planned & Enforced）

| 類型 | 路徑 | 範例 |
|------|------|------|
| UI 路由 | `app/gamefi/` | `app/gamefi/page.tsx`、`gamefi-wallet-shell.tsx` |
| 後端 API | `app/api/gamefi/` | `app/api/gamefi/wallet/route.ts` |
| 業務邏輯 | `lib/gamefi/` | `lib/gamefi/wallet-service.ts`、`ledger-labels.ts` |
| Auth（Phase 1A） | `lib/auth/` | `lib/auth/require-user.ts` |
| DB | `prisma/`、`lib/db/` | `lib/db/client.ts` |

---

## 2. 資料模型與單一事實來源（Data Model & SoT）

### 基礎設施（As-Built）

| 項目 | 值 |
|------|-----|
| Supabase Project Ref | `mtqpvfeyrupmeixkgtpr` |
| 專案名稱 | Wealth Freedom Calculator |
| 區域 | `ap-southeast-1`（新加坡） |
| Prisma Migrations | **3** 支（Phase 1A） |
| GitHub Repo | `kevin860421-dot/wealth-freedom-calculator` |
| Vercel 專案 | `wukaichuan/wealth-freedom-calculator` |
| 正式網址 | https://wealth-freedom-calculator.vercel.app |

### 資料表關係

```
users (1) ── (1) user_wallets (1) ── (N) wallet_ledger
```

| 表 | Prisma Model | DB 欄位 | 說明 |
|----|--------------|---------|------|
| `public.users` | `User` | `auth_subject_id` | 對應 Supabase `auth.users.id` |
| `public.user_wallets` | `UserWallet` | **`gems`**（非 `gems_balance`） | 餘額快取 |
| `public.wallet_ledger` | `WalletLedger` | `gem_change`、`action_type` | Append-only 流水 |

### Ledger SoT 鐵律

1. **Append-Only**：Ledger 只能 `INSERT`。
2. **餘額一致性**：`user_wallets.gems` 與同事務內 `wallet_ledger.gem_change` 一致。
3. **初始發放**：`provisionUserWithWallet` → `gems = 1000` + `INITIAL_GRANT`（`gem_change = +1000`）。

---

## 3. 基礎設施環境變數（.env Spec）

Prisma CLI **只讀 `.env`**；Next.js dev **讀 `.env.local`**。DB 連線建議兩邊都放。

```env
# Supabase 前端 / Auth
NEXT_PUBLIC_SUPABASE_URL=https://mtqpvfeyrupmeixkgtpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable_key>

# Prisma 執行期（Transaction pooler :6543）
DATABASE_URL=postgresql://postgres.mtqpvfeyrupmeixkgtpr:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Prisma migrate（Direct :5432 或 session pooler :5432）
DIRECT_URL=postgresql://postgres:<PASSWORD>@db.mtqpvfeyrupmeixkgtpr.supabase.co:5432/postgres

# Phase 1B Google OAuth 回傳（本機 / Production 各一組）
AUTH_REDIRECT_URL=http://localhost:3000/gamefi/auth/callback
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/gamefi/auth/callback
```

### 本機診斷

```bash
node scripts/check-env.js
```

檢查 `DATABASE_URL`、`DIRECT_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`AUTH_REDIRECT_URL` 是否存在與格式（**不輸出密碼**）。

### Vercel（Production / Preview）

| 變數 | 狀態（截至 Phase 1C） |
|------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
| `DATABASE_URL` | ✅ |
| `DIRECT_URL` | ✅ |
| `AUTH_REDIRECT_URL` | ⚠️ **需補**（見 §3.1） |
| `NEXT_PUBLIC_AUTH_REDIRECT_URL` | ⚠️ **需補** |

> Vercel 環境變數僅影響 Runtime，**不會**自動執行 `prisma migrate deploy`。

### 3.1 Google 登入失敗時檢查路徑

| 平台 | 路徑 | 要確認的 URL |
|------|------|-------------|
| **Supabase** | Dashboard → **Authentication** → **URL Configuration** | **Site URL**、**Redirect URLs** 含 `https://wealth-freedom-calculator.vercel.app/gamefi/auth/callback` |
| **Supabase** | Dashboard → **Authentication** → **Providers** → **Google** | 啟用 + Client ID / Secret |
| **Google Cloud** | [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → 你的 **OAuth 2.0 Client ID** | **Authorized JavaScript origins**：`https://wealth-freedom-calculator.vercel.app`、`http://localhost:3000` |
| **Google Cloud** | 同上 → **Authorized redirect URIs** | `https://<project-ref>.supabase.co/auth/v1/callback`（Supabase 提供的 Google callback，**不是**你的 `/gamefi/auth/callback`） |
| **Vercel** | Project → **Settings** → **Environment Variables** | `NEXT_PUBLIC_AUTH_REDIRECT_URL` = `https://wealth-freedom-calculator.vercel.app/gamefi/auth/callback` |

流程說明：瀏覽器 OAuth 先回 Supabase `auth/v1/callback`，再由 Supabase 導向你的 `AUTH_REDIRECT_URL`（`/gamefi/auth/callback`）。

---

## 4. 部署前 AI 自我驗證（Self-Verification Flow）

| 步驟 | 指令 | 目的 |
|------|------|------|
| 0. 環境 | `node scripts/check-env.js` | 本機 env 齊全 |
| 1. DB | `npx prisma migrate deploy` | Schema 一致 |
| 2. 邊界 + 編譯 | `node scripts/verify-bounds.js` | 核心未動 + build |
| 3. E2E | `npm run test:gamefi` | provision 邏輯 |

```bash
npm run verify:gamefi
```

---

## 5. 驗證程式說明

### A. `scripts/verify-bounds.js`

- 檢查 §1 核心檔案是否存在
- 執行 `npm run build`（失敗時 fallback `npx next build`）

### B. `scripts/check-env.js`

- 讀取 `.env` / `.env.local`，遮罩敏感值後回報

### C. `tests/gamefi/provision.test.ts`

- Transaction rollback 驗證 1000 gems + INITIAL_GRANT

---

## 6. GitHub Actions

Push / PR → `main`：migrate → verify-bounds → test:gamefi。詳見 `.github/workflows/verify-and-deploy.yml`。

---

## 7. 階段路線圖（Roadmap）

| 階段 | 狀態 | 內容 |
|------|------|------|
| Phase 0 / 0.5 | ✅ | 盤點、架構 |
| Phase 1A | ✅ | Prisma、Supabase、`requireUser`、`provisionUserWithWallet` |
| Phase 1B-0 | ✅ | DB、Vercel、GitHub Secrets、CI |
| **Phase 1B** | ✅ | Google 登入、`/gamefi`、`/api/gamefi/me`、OAuth callback |
| **Phase 1C** | ✅ | `GET /api/gamefi/wallet`、流水帳 UI |
| Phase 2 | 計畫中 | Gacha、Betting |

---

## 8. Phase 1C 設計規範（As-Built）

### 8.1 後端 API：`GET /api/gamefi/wallet`

| 項目 | 規範 |
|------|------|
| 路徑 | `app/api/gamefi/wallet/route.ts` |
| 驗證 | `requireUser()`（未登入 → **401**） |
| 查詢 | `user_wallets.gems` + `wallet_ledger` 最近 **10** 筆，`created_at DESC` |
| 錯誤 | DB 異常 → **500** |

**回傳格式**（API 欄位名；DB 實際為 `gems` / `gem_change` / `action_type`）：

```json
{
  "success": true,
  "balance": 1000,
  "ledger": [
    {
      "id": "uuid",
      "type": "INITIAL_GRANT",
      "amount": 1000,
      "balance_after": 1000,
      "created_at": "2026-08-24T12:00:00.000Z"
    }
  ]
}
```

| JSON 欄位 | Prisma / DB 對照 |
|-----------|------------------|
| `balance` | `user_wallets.gems` |
| `ledger[].type` | `wallet_ledger.action_type` |
| `ledger[].amount` | `wallet_ledger.gem_change` |

既有 `GET /api/gamefi/me` 保留（輕量 profile）；wallet 為餘額 + 流水專用。

### 8.2 前端 UI：`app/gamefi/gamefi-wallet-shell.tsx`

| 項目 | 規範 |
|------|------|
| OAuth | `getOAuthRedirectTo()`（`lib/gamefi/oauth-redirect.ts`）讀取 `NEXT_PUBLIC_AUTH_REDIRECT_URL` / `AUTH_REDIRECT_URL`；production 若誤帶 localhost 則改用 `window.location.origin` |
| 登入後 | `fetch("/api/gamefi/wallet")` |
| 區塊 | 寶石餘額卡片 + **資產流水明細**（最近 10 筆） |
| 樣式 | 莫蘭迪深色 Tailwind；正數 `var(--morandi-highlight)`、負數 `#d4a5a5` |
| UX | Loading skeleton；`INITIAL_GRANT` 顯示「系統贈送」 |
| 殼路由 | `app/gamefi/page.tsx`（Server metadata + Suspense） |

---

## 9. 已知技術債

1. DB 密碼輪換（若曾外洩）
2. RLS 未啟用（目前 server-side Prisma）
3. Ledger DB append-only trigger 未加
4. Vercel 需補 `AUTH_REDIRECT_URL` / `NEXT_PUBLIC_AUTH_REDIRECT_URL`
5. OAuth 完整 E2E 自動測試待 Phase 2 前補

---

## 10. 相關檔案索引

```
app/gamefi/page.tsx
app/gamefi/gamefi-wallet-shell.tsx
app/gamefi/auth/callback/route.ts
app/api/gamefi/me/route.ts
app/api/gamefi/wallet/route.ts
lib/gamefi/wallet-service.ts
lib/gamefi/ledger-labels.ts
lib/gamefi/oauth-redirect.ts
lib/auth/require-user.ts
scripts/check-env.js
scripts/verify-bounds.js
tests/gamefi/provision.test.ts
```
