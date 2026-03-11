@echo off
title Khedut Bandhu Backend Verified
echo ===================================================
echo   Starting Backend from: %CD%
echo ===================================================

:: 1. Start MongoDB if not running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is already running.
) else (
    echo [INFO] Starting MongoDB...
    start "MongoDB Server" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\Program Files\MongoDB\Server\8.2\data"
    echo [INFO] Waiting 10 seconds for MongoDB to initialize...
    timeout /t 10 >nul
)

:: 2. Check Dependencies
if not exist node_modules\jsonwebtoken (
    echo [WARN] Installing missing dependencies...
    call npm install
)

:: 3. Start Server
echo [INFO] Starting Node.js Server...
node server.js
pause
