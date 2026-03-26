@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo [push-to-github] %CD%
echo 可傳入 commit 訊息: push-to-github.bat "說明這次改動"
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\push-to-github.ps1" %*

echo.
pause
