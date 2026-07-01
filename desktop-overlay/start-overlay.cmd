@echo off
REM ===  Josh-Fy Overlay launcher  ===
REM Double-click this file to start the always-on visualizer overlay. It installs
REM dependencies the first time, then runs in the tray. A tray icon appears near
REM the clock: left-click to toggle on/off, right-click for options. Close from
REM the tray menu (Quit) to stop.

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies for the first time...
  call npm install
)

echo.
echo Starting Josh-Fy Overlay. Look for the tray icon near the clock.
echo Right-click the tray icon and choose Quit to stop.
echo.

call npm start
