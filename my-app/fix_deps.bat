@echo off
title Fixing Frontend Dependencies
echo ===================================================
echo   Installing Packages with Legacy Peer Deps
echo ===================================================

cd /d "%~dp0"

echo [INFO] Installing recharts, i18next, react-i18next...
echo [INFO] Using --legacy-peer-deps to fix version conflicts.
call npm install recharts i18next react-i18next --legacy-peer-deps

echo.
echo [SUCCESS] Dependencies installed!
echo [INFO] You can now restart your React app (npm start).
pause
