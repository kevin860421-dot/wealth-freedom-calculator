@echo off
REM Push to GitHub - do not put non-ANSI comments here (fixes mojibake on double-click)
cd /d "%~dp0"
title Push to GitHub
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -NoLogo -File "%~dp0scripts\push-to-github.ps1"
exit /b %ERRORLEVEL%
