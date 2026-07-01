@echo off
REM ===  Josh-Fy launcher  ===
REM Double-click this file to start the app. It installs dependencies the first
REM time, starts the dev server, and opens Josh-Fy in your browser. Edit any file
REM in src\, save, and the browser refreshes automatically. Close this window to stop.

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies for the first time...
  call npm install
)

echo.
echo Starting Josh-Fy at http://localhost:5173
echo Leave this window open while you use the app. Close it to stop.
echo.

REM Give the server a moment, then open the browser.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:5173"

call npm run dev
