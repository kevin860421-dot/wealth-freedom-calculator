# 一鍵產生 Quick-11 Excel（微調按鈕 + 折線圖）→ D:\下載
# 用法：關閉 Excel 後，PowerShell 執行：
#   .\scripts\build-quick11-downloads.ps1

$ErrorActionPreference = "Stop"
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Set-Location (Split-Path $PSScriptRoot -Parent)
npm run generate:quick11-excel

Write-Host ""
Write-Host "完成。請開啟：D:\下載\quick11-home-v5-dual-sheets.xlsm"
