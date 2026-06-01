@echo off
echo ======================================================
echo   Tarlac Tourism - Inventory Supply Data System
echo   One-command setup from root folder
echo ======================================================
echo.

echo [1/3] Installing root dependencies (concurrently)...
call npm install --ignore-scripts
if %ERRORLEVEL% neq 0 ( echo ERROR: Root install failed & pause & exit /b 1 )

echo.
echo [2/3] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 ( echo ERROR: Backend install failed & pause & exit /b 1 )
cd ..

echo.
echo [3/3] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 ( echo ERROR: Frontend install failed & pause & exit /b 1 )
cd ..

echo.
echo [ENV] Copying .env file...
if not exist backend\.env (
    copy .env.example backend\.env
    echo backend\.env created from .env.example
) else (
    echo backend\.env already exists, skipping.
)

echo.
echo ======================================================
echo   SETUP COMPLETE!
echo ======================================================
echo.
echo NEXT STEPS:
echo   1. Make sure MongoDB is running
echo   2. (Optional) Edit backend\.env for your DB settings
echo   3. Run: npm run dev       ^<-- starts BOTH servers
echo   4. Open: http://localhost:3000
echo   5. Seed demo data: npm run seed
echo.
echo   Admin Login: admin@tarlac.gov.ph / Admin@2026
echo ======================================================
pause
