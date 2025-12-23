@echo off
setlocal

echo ==========================================
echo [Selpix] Selpix Mockup Auto-Launcher
echo ==========================================

:: 1. Update from Git
echo [1/4] Updating code from Git...
git pull
if %ERRORLEVEL% neq 0 (
    echo [Error] git pull failed. Please check your internet or git status.
    pause
    exit /b %ERRORLEVEL%
)

:: 2. Install Dependencies
echo [2/4] Installing dependencies (pnpm)...
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo [Error] pnpm install failed.
    pause
    exit /b %ERRORLEVEL%
)

:: 3. Database Sync
echo [3/4] Syncing Database (Prisma)...
call npx prisma generate
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo [Error] Prisma sync failed.
    pause
    exit /b %ERRORLEVEL%
)

:: 4. Start Server
echo [4/4] Starting Application...
echo.
echo ==========================================
echo App will be available at:
echo - Local: http://localhost:3001
echo - Network: http://(Your-IP-Address):3001
echo.
echo Tip: Use 'ipconfig' in another CMD to find your IP.
echo ==========================================
echo.

:: Allow external access by setting HOSTNAME
set HOSTNAME=0.0.0.0
call pnpm dev

pause
