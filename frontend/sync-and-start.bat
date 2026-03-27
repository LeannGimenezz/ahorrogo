@echo off
echo ================================================
echo   AhorroGO - Sincronizar y Reiniciar Frontend
echo ================================================
echo.

cd /d C:\Users\leang\Desktop\ahorrogo\frontend

echo [1/4] Limpiando cache de Vite...
if exist .vite rmdir /s /q .vite
if exist node_modules\.vite rmdir /s /q "node_modules\.vite"
echo   OK: Cache limpio

echo.
echo [2/4] Verificando archivos...
if exist "src\components\auth\AuthProvider.tsx" (
    echo   OK: AuthProvider.tsx
) else (
    echo   FALTA: AuthProvider.tsx
)
if exist "src\hooks\useAuth.ts" (
    echo   OK: useAuth.ts
) else (
    echo   FALTA: useAuth.ts
)

echo.
echo [3/4] Iniciando Vite...
echo.
echo ================================================
echo   Frontend: http://localhost:5173
echo   Si hay errores, presiona 'r' para recargar
echo ================================================
echo.

npm run dev