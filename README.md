# 財富自由計算機

台股 ETF／股票、定期定額、股利再投入與稅負試算（Next.js）。

## 本機執行

```bash
npm install
npm run dev
```

瀏覽器開啟 [http://localhost:3000](http://localhost:3000)。

Webpack 開發模式：

```bash
npm run dev -- --webpack
```

## 建置

```bash
npm run build
npm start
```

## 推送到 GitHub（一鍵腳本）

專案根目錄有 **`push-to-github.bat`**：雙擊後會執行 `scripts/push-to-github.ps1`（`git add` → 有變更則 `commit` → `push origin main`）。Cursor 可用 **`Tasks: Run Task`** → **`Git: 推送到 GitHub (main)`**（不會卡在等你按鍵）。

### 怎樣算「成功」

請在視窗內對照下列訊息（**綠字 `DONE`** 為腳本最後一步）：

| 情況 | 代表什麼 |
|------|----------|
| `Everything up-to-date` | 本機與 GitHub **已同步**，沒有新的 commit 需要推上去（**仍算成功**）。 |
| `main -> main` 或 `To https://github.com/...` 且無 `[ERROR]` | **有推送**新 commit 到遠端，**成功**。 |
| 綠色 **`DONE - GitHub push finished OK.`** | 腳本流程跑完且結束代碼為 0，**成功**。 |
| `[ERROR] git ...` 或 `NOT DONE` | **未成功**，請往上捲查看 git 訊息（常見：未登入、網路、衝突）。 |

**注意：** Git 有時會把一般說明印在**紅色**，不一定是失敗；以是否有 **`[ERROR]`**、結尾是否 **`DONE`**、以及 `git push` 是否報錯為準。

## 專案識別

- **顯示名稱（中文）**：財富自由計算機  
- **npm / 資料夾英文名稱**（`package.json` 的 `name`）：**`wealth-freedom-calculator`**（英文，非拼音）  
- 若本機資料夾仍為 `engineer-retire-calculator`，可改名為 **`wealth-freedom-calculator`** 以與套件名一致；步驟見 [`docs/RENAME-FOLDER.md`](./docs/RENAME-FOLDER.md)。

試算結果僅供參考，投資與報稅請以法令與實際公告為準。
