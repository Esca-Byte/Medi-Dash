@echo off
title Med-Dash Launcher
color 0A
echo.
echo =============================================
echo        Med-Dash Application Launcher
echo =============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node -v
echo.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [SETUP] Installing root dependencies...
    call npm install
    echo.
)

if not exist "client\node_modules" (
    echo [SETUP] Installing client dependencies...
    cd client
    call npm install
    cd ..
    echo.
)

if not exist "server\node_modules" (
    echo [SETUP] Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
)

echo =============================================
echo  Starting Server (port 5000) and Client (port 5173)...
echo =============================================
echo.


:: Start the server in a new window
start "Med-Dash Server" cmd /k "cd /d %~dp0server && echo [SERVER] Starting on port 5000... && npx nodemon index.js"

:: Wait a moment for server to initialize
timeout /t 3 /nobreak >nul

:: Start the client in a new window
start "Med-Dash Client" cmd /k "cd /d %~dp0client && echo [CLIENT] Starting Vite dev server... && npx vite"

echo.
echo =============================================
echo  Both services are starting in separate windows!
echo.
echo  Server: http://localhost:5000
echo  Client: http://localhost:5173
echo =============================================
echo.
echo  Close this window or press any key to exit this launcher.
echo  (The server and client will keep running in their own windows)
pause >nul
