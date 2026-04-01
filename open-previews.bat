@echo off
REM Open previews - do not put non-ANSI comments here (fixes mojibake on double-click)
cd /d "%~dp0"
title Open previews (press Enter)

echo.
echo Ready to start servers and open previews.
echo Press ENTER to start...
pause >nul

REM Prefer opening in Google Chrome
set "CHROME_EXE="
for /f "delims=" %%I in ('where chrome 2^>nul') do (
  set "CHROME_EXE=%%I"
  goto :chrome_found
)
:chrome_found

REM Start Next dev server in a new window
start "Next Dev" cmd /k "cd /d \"%~dp0\" && npm run dev -- --webpack"

REM Start share-image preview server in a new window
start "Share Image (5179)" cmd /k "cd /d \"%~dp0\" && npx serve \"tools/share-image-generator\" -p 5179"

REM Give servers a moment to start
timeout /t 3 /nobreak >nul

REM Detect which Next dev port is alive (prefer 3000, fallback to 3001/3002)
set "CALC_PORT=3000"
for %%P in (3000 3001 3002) do (
  powershell -NoProfile -Command "exit([int](-not (Test-NetConnection -ComputerName localhost -Port %%P -InformationLevel Quiet)))" >nul 2>nul
  if not errorlevel 1 (
    set "CALC_PORT=%%P"
    goto :port_found
  )
)
:port_found

set "URL_DESKTOP=http://localhost:%CALC_PORT%/"
set "URL_MOBILE=http://localhost:%CALC_PORT%/?mobile=1"
set "URL_SHARE=http://localhost:5179/index.html"

if defined CHROME_EXE (
  REM Open all three in ONE Chrome window (3 tabs)
  start "" "%CHROME_EXE%" --new-window "%URL_DESKTOP%" "%URL_MOBILE%" "%URL_SHARE%"
) else (
  start "" "%URL_DESKTOP%"
  start "" "%URL_MOBILE%"
  start "" "%URL_SHARE%"
)

echo.
echo Opened:
echo - Desktop: %URL_DESKTOP%
echo - Mobile : %URL_MOBILE%
echo - Cards  : %URL_SHARE%
echo.
echo If a page doesn't open, check server windows.
echo.
pause
exit /b 0

