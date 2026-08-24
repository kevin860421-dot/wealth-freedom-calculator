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
npm run verify:gamefi
```

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
| UI 路由 | `app/gamefi/` | `app/gamefi/gacha/page.tsx` |
| 後端 API | `app/api/gamefi/` | `app/api/gamefi/wallet/route.ts` |
| 業務邏輯 | `lib/gamefi/` | `lib/gamefi/wallet-service.ts` |
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

### 資料表關係

```
users (1) ── (1) user_wallets (1) ── (N) wallet_ledger
```

| 表 | Prisma Model | 說明 |
|----|--------------|------|
| `public.users` | `User` | 應用層用戶；`auth_subject_id` 對應 Supabase `auth.users.id` |
| `public.user_wallets` | `UserWallet` | 寶石餘額快取欄位 `gems`（與 ledger 同事務更新） |
| `public.wallet_ledger` | `WalletLedger` | 流水帳；欄位 `gem_change`、`balance_after` |

### Ledger SoT 鐵律

1. **Append-Only**：Ledger 只能 `INSERT`；禁止 `UPDATE` / `DELETE`（目前為 **application-level**；未來可加 DB trigger migration）。
2. **餘額一致性**：`user_wallets.gems` 變更必須與同一 transaction 內 ledger 的 `gem_change` 相符。
3. **初始發放**：新用戶 `provisionUserWithWallet` → `gems = 1000` + 一筆 `INITIAL_GRANT` ledger（`gem_change = +1000`）。

實作位置：`lib/auth/require-user.ts`（`lib/gamefi/wallet-service.ts` 為穩定 re-export）。

---

## 3. 基礎設施環境變數（.env Spec）

Prisma CLI **只讀 `.env`**；Next.js dev **讀 `.env.local`**。兩邊都要放 DB 連線。

```env
# Supabase 前端 / Auth（可公開）
NEXT_PUBLIC_SUPABASE_URL=https://mtqpvfeyrupmeixkgtpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable_key>

# Prisma 執行期（Transaction pooler, port 6543）
DATABASE_URL=postgresql://postgres.mtqpvfeyrupmeixkgtpr:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Prisma migrate deploy（Direct, port 5432）
DIRECT_URL=postgresql://postgres:<PASSWORD>@db.mtqpvfeyrupmeixkgtpr.supabase.co:5432/postgres
```

### Vercel（Production / Preview）

上述四個變數已配置於 `wukaichuan/wealth-freedom-calculator`。

> **注意**：Vercel 環境變數僅影響 **Runtime**，部署時**不會**自動執行 `prisma migrate deploy`。Schema 變更須在本機或 CI 先跑 migration。

---

## 4. 部署前 AI 自我驗證（Self-Verification Flow）

### 驗證三部曲

| 步驟 | 指令 | 目的 |
|------|------|------|
| 1. DB 結構一致 | `npx prisma migrate deploy` | 防範 schema 斷層 |
| 2. 邊界 + 編譯 | `node scripts/verify-bounds.js` | 核心檔案存在 + TypeScript 通過 |
| 3. E2E 開戶發寶石 | `npm run test:gamefi` | `provisionUserWithWallet` 邏輯正確 |

一鍵執行：

```bash
npm run verify:gamefi
```

完整 production build（較慢，CI 用）：

```bash
VERIFY_FULL_BUILD=1 node scripts/verify-bounds.js
```

---

## 5. 驗證程式說明

### A. `scripts/verify-bounds.js`

- 檢查 §1 核心檔案是否存在
- 執行 `npm run typecheck`
- `VERIFY_FULL_BUILD=1` 時額外執行 `npm run build`

### B. `tests/gamefi/provision.test.ts`

- 連線真實 `DATABASE_URL`
- 在 **單一 transaction** 內呼叫 `provisionUserWithWallet`，驗證後 **rollback**（不留測試髒資料）
- 斷言：`gems === 1000`、ledger 一筆、`gem_change === 1000`、`action_type === INITIAL_GRANT`

---

## 6. GitHub Actions（`.github/workflows/verify-and-deploy.yml`）

Push / PR 至 `main` 時自動：

1. `npm ci`
2. `prisma migrate deploy`（需設定 repo secrets）
3. `verify-bounds.js` + 完整 build
4. `npm run test:gamefi`

**必要 Secrets（GitHub → Settings → Secrets）：**

| Secret | 說明 |
|--------|------|
| `SUPABASE_DATABASE_URL_POOLER` | 同 `DATABASE_URL` |
| `SUPABASE_DIRECT_URL` | 同 `DIRECT_URL` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key |

未設定 DB secrets 時，workflow 會略過 DB 相關步驟但仍跑邊界與 build。

Vercel 已透過 Git 整合自動部署；此 workflow 為**驗證閘門**，不取代 Vercel deploy hook。

---

## 7. 階段路線圖（Roadmap）

| 階段 | 狀態 | 內容 |
|------|------|------|
| **Phase 0** | ✅ | 只讀盤點 |
| **Phase 0.5** | ✅ | 架構設計 |
| **Phase 1A** | ✅ | Prisma schema、Supabase client、`requireUser`、`provisionUserWithWallet` |
| **Phase 1B-0** | ✅ | DB 連線、migration、Vercel env |
| **Phase 1B** | 🔜 | `app/gamefi/` 登入 UI、OAuth 流程 |
| **Phase 1C** | 計畫中 | `GET /api/gamefi/wallet` |
| **Phase 2** | 計畫中 | Gacha、Betting、對應 ledger 規則 |

---

## 8. 已知技術債與安全計畫

1. **DB 密碼輪換**：若曾在對話或 log 暴露，應至 Supabase → Database → Reset password，並同步 `.env` / Vercel。
2. **RLS 未啟用**：目前僅 server-side Prisma；若未來前端直連 Supabase，須補 RLS policy。
3. **Ledger DB 層 append-only**：尚未有 trigger / REVOKE migration（規劃：`004_wallet_ledger_append_only_guard`）。
4. **Auth E2E**：`test:gamefi` 目前測 wallet provision；完整 OAuth 流程待 Phase 1B。

---

## 9. 相關檔案索引

```
prisma/schema.prisma
prisma/migrations/20260824100100_init_users/
prisma/migrations/20260824100200_init_wallets/
prisma/migrations/20260824100300_init_wallet_ledger/
lib/db/client.ts
lib/supabase/{env,browser,server}.ts
lib/auth/require-user.ts
lib/gamefi/wallet-service.ts
scripts/verify-bounds.js
tests/gamefi/provision.test.ts
.github/workflows/verify-and-deploy.yml
```
