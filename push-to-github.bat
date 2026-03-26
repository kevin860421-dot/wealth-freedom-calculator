@echo off
REM 雙擊後請在「同一個藍色/黑色視窗」內操作；關閉前需按任意鍵（由 PowerShell 處理，比 cmd 的 pause 穩定）
cd /d "%~dp0"
title Push to GitHub
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -NoLogo -File "%~dp0scripts\push-to-github.ps1"
exit /b %ERRORLEVEL%
