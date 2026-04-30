@echo off
title Khedut Bandhu - Professional Launcher
echo ===================================================
echo   🚀 Khedut Bandhu - Launching All Services
echo ===================================================

:: 1. Start AI Microservice (Python FastAPI)
echo [1/4] Starting AI Service (Port 8000)...
cd /d d:\frontend\react_project_091
start "AI Service" cmd /k "myenv\Scripts\activate && python ../ai-service/main.py"

:: 2. Start Backend Server (Node.js)
echo [2/4] Starting Node.js Backend (Port 3000)...
cd /d d:\frontend\react_project_091\backend
start "Backend Server" cmd /k "node server.js"

:: 3. Start Frontend UI (React)
echo [3/4] Starting React Frontend (Port 5000)...
cd /d d:\frontend\my-app
start "Frontend UI" cmd /k "npm start"

echo [4/4] Finalizing...
echo ===================================================
echo ✅ All services are launching in separate windows.
echo 🌿 AI Service: http://localhost:8000
echo 🖥️  Backend:    http://localhost:3000
echo 📱 Frontend:   http://localhost:5000
echo ===================================================
timeout /t 5
exit
