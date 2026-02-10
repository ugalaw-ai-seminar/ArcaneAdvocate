@echo off
echo ==========================================
echo      Arcane Advocate - Startup Script
echo ==========================================
echo.
echo Stopping any old game processes...
call npx kill-port 3000
echo.
echo Starting Game Server and Client...
echo Please wait for the green URL to appear.
echo.
call npm run dev
pause
