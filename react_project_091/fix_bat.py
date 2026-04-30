import os

content = """@echo off
set "BACKEND_DIR=D:\\frontend\\react_project_091"
set "AI_DIR=D:\\frontend\\ai-service"
set "FRONTEND_DIR=D:\\frontend\\my-app"

echo Starting KhedUT Bandhu Expert System...

echo Status: Starting Backend...
start "KB_BACKEND" cmd /k "cd /d %BACKEND_DIR% && node server.js"

echo Status: Starting AI Service...
start "KB_AI" cmd /k "cd /d %AI_DIR% && ..\\react_project_091\\myenv\\Scripts\\activate && python main.py"

echo Status: Starting Frontend...
start "KB_FRONTEND" cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo All terminals launching. Check status in windows.
pause
"""

with open("start_expert_v3.bat", "w", encoding="ascii", errors="ignore") as f:
    f.write(content)

print("File created successfully with ASCII encoding.")
