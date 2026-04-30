@echo off
title Khedut Bandhu Server Launcher
echo ===================================================
echo   Khedut Bandhu - Starting Services
echo ===================================================

:: 1. Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is already running.
) else (
    echo [INFO] Starting MongoDB...
    start "MongoDB Server" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\Program Files\MongoDB\Server\8.2\data"
    echo [INFO] Waiting 10 seconds for MongoDB to initialize...
    timeout /t 10 >nul
)

:: 2. Start Backend Server
echo [INFO] Starting Backend Server...
cd react_project_091
if not exist node_modules (
    echo [WARN] node_modules not found! Installing dependencies...
    call npm install
)

:: Check specific dependency
if not exist node_modules\jsonwebtoken (
    echo [WARN] jsonwebtoken missing! Installing...
    call npm install jsonwebtoken
)

if not exist node_modules\razorpay (
    echo [WARN] razorpay missing! Installing...
    call npm install razorpay
)

node server.js
pause
