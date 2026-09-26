# Canvas 樣板還原

Cursor 預覽用路徑：

`%USERPROFILE%\.cursor\projects\d-73-Wealth-Freedom-Calculator\canvases\after-tax-dividend-report-template.canvas.tsx`

從本 repo 還原：

```powershell
cd "d:\吳鎧全的資料\73_Wealth Freedom Calculator"
Copy-Item -Force "design-checkpoints\canvas\after-tax-dividend-report-template.canvas.tsx" "$env:USERPROFILE\.cursor\projects\d-73-Wealth-Freedom-Calculator\canvases\after-tax-dividend-report-template.canvas.tsx"
```

目前可回溯的預覽（表格欄位正常、展開尚未改成中等寬度卡片）：

Git tag：`checkpoint/canvas-before-medium-expand-card-2026-09-26`

```powershell
cd "d:\吳鎧全的資料\73_Wealth Freedom Calculator"
git checkout checkpoint/canvas-before-medium-expand-card-2026-09-26 -- "design-checkpoints/canvas/after-tax-dividend-report-template.canvas.tsx"
Copy-Item -Force "design-checkpoints\canvas\after-tax-dividend-report-template.canvas.tsx" "$env:USERPROFILE\.cursor\projects\d-73-Wealth-Freedom-Calculator\canvases\after-tax-dividend-report-template.canvas.tsx"
```

更早的桌機表：`checkpoint/canvas-after-tax-desktop-2026-09-21`

部落格桌機表另見：`checkpoint/pre-after-tax-mobile-expand-2026-09-21`（`f179d07`）。
