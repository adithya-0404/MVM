@echo off
echo Starting Multi Vendor Marketplace...
echo.

start "ML Service" /D "%~dp0ml-service" cmd /k "python -m uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

start "Backend Server" /D "%~dp0server" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

start "Frontend Client" /D "%~dp0client" cmd /k "npm run dev"

echo.
echo All services started!
echo ML Service   -> http://localhost:8000
echo Backend      -> http://localhost:5000
echo Frontend     -> http://localhost:5173
echo.
pause
