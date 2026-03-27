@echo off
echo ================================================
echo   AhorroGO - Detener Servicios
echo ================================================
echo.

echo Deteniendo servicios...

:: Detener Backend (Python/Uvicorn)
taskkill /FI "WINDOWTITLE eq AhorroGO - Backend*" /F > nul 2>&1
taskkill /IM "python.exe" /FI "WINDOWTITLE eq *uvicorn*" /F > nul 2>&1

:: Detener Frontend (Node/Vite)
taskkill /FI "WINDOWTITLE eq AhorroGO - Frontend*" /F > nul 2>&1
taskkill /IM "node.exe" /FI "WINDOWTITLE eq *vite*" /F > nul 2>&1

echo.
echo [OK] Servicios detenidos
echo.
pause