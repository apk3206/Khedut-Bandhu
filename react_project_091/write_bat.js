const fs = require('fs');
const content = `@echo off
set "BACKEND_DIR=D:\\frontend\\react_project_091"
set "AI_DIR=D:\\frontend\\ai-service"
set "FRONTEND_DIR=D:\\frontend\\my-app"

echo Starting Khedut Bandhu Expert System...

echo Status: Starting Backend Server...
start "KB-BACKEND" cmd /k "cd /d %BACKEND_DIR% && node server.js"

echo Status: Starting AI Expert Microservice...
start "KB-AI" cmd /k "cd /d %AI_DIR% && ..\\react_project_091\\myenv\\Scripts\\activate && python main.py"

echo Status: Starting Frontend UI...
start "KB-FRONTEND" cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo All terminals launching. You can now refresh your browser.
pause`;

fs.writeFileSync('start_expert.bat', content, { encoding: 'ascii' });
console.log('File start_expert.bat created successfully.');
