@echo off
set "BACKEND_DIR=D:\frontend\react_project_091"
set "AI_DIR=D:\frontend\ai-service"
set "FRONTEND_DIR=D:\frontend\my-app"

echo 🚀 Starting Khedut Bandhu EXPERT SYSTEM...

:: 1. Start Node.js Backend
echo [1/3] Starting Backend Server...
start "KB-BACKEND" cmd /k "cd /d %BACKEND_DIR% && node server.js"

:: 2. Start AI Microservice
echo [2/3] Starting AI Expert Microservice...
start "KB-AI-EXPERT" cmd /k "cd /d %AI_DIR% && ..\react_project_091\myenv\Scripts\activate && python main.py"

:: 3. Start React Frontend
echo [3/3] Starting Frontend UI...
start "KB-FRONTEND" cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo ✅ All systems launching!
echo 💡 Please wait for all terminals to show 'Ready' or 'Compiled' then refresh your browser.
pause
