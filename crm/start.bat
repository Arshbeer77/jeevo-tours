@echo off
REM Jeevo Tours CRM - Quick Start Script for Windows
echo.
echo ========================================
echo   Jeevo Tours CRM - Quick Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Initializing database...
python database.py

if errorlevel 1 (
    echo [ERROR] Failed to initialize database
    pause
    exit /b 1
)

echo.
echo [3/4] Starting FastAPI server...
echo.
echo ========================================
echo   CRM Server Running!
echo ========================================
echo.
echo   Admin Dashboard: http://localhost:8000/admin
echo   API Documentation: http://localhost:8000/docs
echo   Health Check: http://localhost:8000/health
echo.
echo   Press CTRL+C to stop the server
echo ========================================
echo.

python main.py
