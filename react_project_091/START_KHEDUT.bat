@echo off
title Khedut Bandhu - AI Expert System
color 0A

echo.
echo  =====================================================
echo   KHEDUT BANDHU AI EXPERT SYSTEM - STARTUP
echo  =====================================================
echo.

REM --- 1. Node.js Backend (Port 5000) ---
echo  [1/3] Starting Node.js Backend (Port 5000)...
start "KB-Backend" cmd /k "cd /d D:\frontend\react_project_091 && node server.js"
timeout /t 3 /nobreak >nul

REM --- 2. FastAPI AI Service (Port 8000) ---
echo  [2/3] Starting AI Service (Port 8000)...
start "KB-AI-Service" cmd /k "cd /d D:\frontend\ai-service && D:\frontend\react_project_091\myenv\Scripts\python.exe main.py"
timeout /t 4 /nobreak >nul

REM --- 3. React Frontend (Port 3000) ---
echo  [3/3] Starting React Frontend (Port 3000)...
start "KB-Frontend" cmd /k "cd /d D:\frontend\my-app && npm start"

echo.
echo  =====================================================
echo   ALL SERVICES STARTING
echo   Backend  : http://localhost:5000
echo   AI Brain : http://localhost:8000
echo   Frontend : http://localhost:3000
echo  =====================================================
echo.
echo  If accuracy is low, run the training script:
echo    cd D:\frontend\react_project_091
echo    TRAIN_MODEL.bat
echo.
pause
