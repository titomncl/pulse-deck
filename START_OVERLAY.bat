@echo off
title Stream Overlay Server
color 0A
echo.
echo ================================
echo   STREAM OVERLAY v2.0
echo ================================
echo.
echo Starting server...
echo.
echo Keep this window open while streaming!
echo.
echo Customize page will open automatically...
echo.
echo ================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo First time setup detected!
    echo Installing dependencies... This may take a few minutes.
    echo.
    call npm install
    echo.
    echo Installation complete!
    echo.
)

REM Start the server
call npm start

pause
