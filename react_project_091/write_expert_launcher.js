const fs = require('fs');
const path = require('path');

const batPath = path.join(__dirname, 'start_khedut_expert_v3.bat');

const content = `@echo off
set "BACKEND_DIR=D:\\frontend\\react_project_091"
set "AI_DIR=D:\\frontend\\ai-service"
set "FRONTEND_DIR=D:\\frontend\\my-app"

echo Starting Khedut Bandhu EXPERT SYSTEM (Dark Mode)...

echo [1/3] Starting Backend Server...
start "KB-BACKEND" cmd /k "cd /d %BACKEND_DIR% && node server.js"

echo [2/3] Starting AI Expert Microservice...
start "KB-AI-EXPERT" cmd /k "cd /d %AI_DIR% && ..\\react_project_091\\myenv\\Scripts\\activate && python main.py"

echo [3/3] Starting Frontend UI (Premium Dark)...
start "KB-FRONTEND" cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo All systems launching!
pause`;

fs.writeFileSync(batPath, content, { encoding: 'ascii' });
console.log('✅ start_khedut_expert_v3.bat created with ASCII encoding.');
