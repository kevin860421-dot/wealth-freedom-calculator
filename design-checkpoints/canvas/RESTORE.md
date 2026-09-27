# Canvas 樣板還原

Cursor 預覽用路徑：

`%USERPROFILE%\.cursor\projects\d-73-Wealth-Freedom-Calculator\canvases\after-tax-dividend-report-template.canvas.tsx`

目前可回溯的預覽（桌機整欄隱藏、表格 `width: 100%`、代號標題靠左、手機表未改）：

Git tag：`checkpoint/canvas-desktop-column-hide-2026-09-27`

```powershell
cd "d:\吳鎧全的資料\73_Wealth Freedom Calculator"
git checkout checkpoint/canvas-desktop-column-hide-2026-09-27 -- "design-checkpoints/canvas/after-tax-dividend-report-template.canvas.tsx" "design-checkpoints/canvas/RESTORE.md"
Copy-Item -Force "design-checkpoints\canvas\after-tax-dividend-report-template.canvas.tsx" "$env:USERPROFILE\.cursor\projects\d-73-Wealth-Freedom-Calculator\canvases\after-tax-dividend-report-template.canvas.tsx"
```

上一個節點（表格欄位正常、展開尚未改成中等寬度卡片）：

Git tag：`checkpoint/canvas-before-medium-expand-card-2026-09-26`

```powershell
cd "d:\吳鎧全的資料\73_Wealth Freedom Calculator"
git checkout checkpoint/canvas-before-medium-expand-card-2026-09-26 -- "design-checkpoints/canvas/after-tax-dividend-report-template.canvas.tsx"
Copy-Item -Force "design-checkpoints\canvas\after-tax-dividend-report-template.canvas.tsx" "$env:USERPROFILE\.cursor\projects\d-73-Wealth-Freedom-Calculator\canvases\after-tax-dividend-report-template.canvas.tsx"
```

更早的桌機表：`checkpoint/canvas-after-tax-desktop-2026-09-21`

部落格桌機表另見：`checkpoint/pre-after-tax-mobile-expand-2026-09-21`（`f179d07`）。
