@echo off
setlocal

echo =========================================
echo   YOLO Traffic Detection Microservice
echo =========================================
echo.

python --version >nul 2>&1
if not %errorlevel% == 0 (
    echo [ERROR] Python not found. Install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

echo [1/3] Checking if ultralytics is installed...
python -c "import ultralytics" >nul 2>&1
if not %errorlevel% == 0 (
    echo [2/3] Installing requirements (first time, downloads ~200 MB^)...
    pip install -r requirements.txt
) else (
    echo [2/3] Dependencies already installed.
)

echo [3/3] Starting YOLO service on http://localhost:8081 ...
echo       Press Ctrl+C to stop.
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8081

endlocal
pause
