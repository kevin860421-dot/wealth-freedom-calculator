@echo off
REM Open previews - do not put non-ANSI comments here (fixes mojibake on double-click)
cd /d "%~dp0"
title Open previews

REM Open calculator desktop + mobile preview and share-image generator preview
start "" "http://localhost:3000/"
start "" "http://localhost:3000/?mobile=1"
start "" "http://localhost:5179/index.html"

echo.
echo If a page doesn't open, start dev servers first:
echo - npm run dev -- --webpack
echo - npx serve "tools/share-image-generator" -p 5179
echo.
pause
exit /b 0

