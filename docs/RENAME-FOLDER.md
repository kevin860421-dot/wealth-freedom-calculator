# Rename project folder to `wealth-freedom-calculator`

If the folder is still `engineer-retire-calculator`, you can rename it to match `package.json` `name` (English, no pinyin).

## Before you start

1. Stop `npm run dev` (Ctrl+C in the terminal).
2. Close Cursor/VS Code when the **project root** is this folder (or open the parent `01-Financial-freedom` instead).

## Option A: File Explorer

Under `01-Financial-freedom`, rename folder **`engineer-retire-calculator`** to **`wealth-freedom-calculator`**.

## Option B: PowerShell (run inside `01-Financial-freedom`)

A helper script **`rename-to-wealth-freedom-calculator.ps1`** lives next to the project folder. Run:

```powershell
cd "path\to\01-Financial-freedom"
.\rename-to-wealth-freedom-calculator.ps1
```

Or one line:

```powershell
Rename-Item -LiteralPath ".\engineer-retire-calculator" -NewName "wealth-freedom-calculator"
```

## After renaming

- Open the new path in Cursor: `…\01-Financial-freedom\wealth-freedom-calculator`
- If build acts odd, delete `.next` and run `npm run build`
