@echo off
title Pulse Deck - Stream Overlay
color 0D
echo.
echo ================================
echo   PULSE DECK v0.1.0
echo ================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [!] First time setup detected!
    echo [*] Installing dependencies... This may take a few minutes.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo Please install Node.js 18+ from: https://nodejs.org/
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed!
    echo.
)

REM Check if dist folder exists (build required)
if not exist "dist\" (
    echo [!] Build folder not found...
    echo [*] Building application... This may take a minute.
    echo.
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to build application!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Application built successfully!
    echo.
)

echo [*] Starting Pulse Deck server...
echo.
echo     Customize: http://localhost:3000/customize
echo     Display:   http://localhost:3000/display
echo.
echo Keep this window open while using the overlay!
echo Press Ctrl+C to stop the server
echo.

REM Start the server
call npm start

pause
