@echo off
REM Open previews + start servers - do not put non-ANSI comments here (fixes mojibake on double-click)
cd /d "%~dp0"
title Start servers + open previews

echo.
echo Ready to start dev servers and open previews.
echo Press ENTER to start...
pause >nul

REM Start Next dev server (webpack) in a new window
start "Next Dev (3000)" cmd /k "cd /d \"%~dp0\" && npm run dev -- --webpack"

REM Start static server for share-image generator in a new window
start "Share Image Preview (5179)" cmd /k "cd /d \"%~dp0\" && npx serve \"tools/share-image-generator\" -p 5179"

REM Give servers a moment to start
timeout /t 3 /nobreak >nul

REM Open URLs
start "" "http://localhost:3000/"
start "" "http://localhost:3000/?mobile=1"
start "" "http://localhost:5179/index.html"

echo.
echo Opened:
echo - Desktop: http://localhost:3000/
echo - Mobile : http://localhost:3000/?mobile=1
echo - Share  : http://localhost:5179/index.html
echo.
echo Tip: If port is busy, check the server windows.
echo.
pause
exit /b 0

