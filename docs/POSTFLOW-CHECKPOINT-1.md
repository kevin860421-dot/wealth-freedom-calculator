# PostFlow 截點 1（Checkpoint 1）

**日期：** 2026-04-18  
**範圍：** `app/postflow/`（以 `library/page.tsx` 為核心）

此文件記錄使用者確認的**穩定基準**。後續若要「回到截點 1」，請對照此檔與 git（若有 commit／tag）。

## 含義

- **左右欄版面「統一版」已還原**：範例參考欄恢復較早配置（例如工具列 `px-7`、內文區 `padding: 24px 32px 64px`、範例正文 `fontSize: 15px` 等），**未**採用共用 `paperColumnStyle` 與右欄內層白底紙張。
- **「全部交由 AI 完成」按鈕**：維持**首版實作**規格——`MOR_FIELD_BG`／`MOR_FIELD_BR`、`padding: 6px 10px`、`1.5px` 邊框、`rounded-lg`、`text-[11px]`、`gap-1.5`，**勿**在未要求下改成透明底、或与「封面／截圖」強制共用另一套 chip。

## 技術備註（當時已處理）

- 寫作區 `textarea`：使用 `overflowY: auto`，避免長文被裁切。
- `Pane` 標題列：標題／`headerRight`／收合箭頭為**兄弟節點**，避免 `<button>` 巢狀。

## 建議版本化

若目錄已納入 git：

```bash
git add app/postflow
git commit -m "chore(postflow): checkpoint 1 baseline"
git tag -a postflow-checkpoint-1 -m "PostFlow 截點 1"
```

未納入 git 前，**以此檔 + 當時檔案內容**為準。
