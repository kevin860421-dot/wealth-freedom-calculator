@echo off
setlocal EnableExtensions
REM Paths with spaces / Chinese: use cd "%~dp0." so trailing \ does not break quotes
cd /d "%~dp0."

set "ROOT=%CD%"
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

REM /D sets working directory - avoids nested "cd ..." quotes breaking on non-ASCII paths
start "Next Dev" /D "%ROOT%" cmd /k npm run dev -- --webpack

start "Share Image 5179" /D "%ROOT%" cmd /k npx serve "tools\share-image-generator" -p 5179

timeout /t 3 /nobreak >nul

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
