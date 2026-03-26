@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM 雙擊即可：不需輸入；commit 訊息由腳本自動產生（時間戳）
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\push-to-github.ps1"
exit /b %ERRORLEVEL%
