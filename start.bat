@echo off
echo ================================================
echo   AhorroGO - Iniciar Proyectos
echo ================================================
echo.

:: Colores para Windows
color 0A

:: Verificar si estamos en el directorio correcto
if not exist "backend\app\main.py" (
    echo [ERROR] No se encuentra el directorio 'backend'
    echo Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] No se encuentra el directorio 'frontend'
    echo Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo [1/4] Verificando dependencias del backend...
cd backend
if not exist "venv" (
    echo [INFO] Creando entorno virtual...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt > nul 2>&1
echo [OK] Dependencias del backend instaladas

echo.
echo [2/4] Verificando dependencias del frontend...
cd ..\frontend
if not exist "node_modules" (
    echo [INFO] Instalando dependencias de npm...
    npm install
)
echo [OK] Dependencias del frontend instaladas

echo.
echo [3/4] Iniciando Backend (puerto 8000)...
cd ..\backend
start "AhorroGO - Backend" cmd /k "call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo [OK] Backend iniciado en http://localhost:8000

echo.
echo [4/4] Iniciando Frontend (puerto 5173)...
cd ..\frontend
start "AhorroGO - Frontend" cmd /k "npm run dev"
echo [OK] Frontend iniciado en http://localhost:5173

echo.
echo ================================================
echo   Servicios Iniciados!
echo ================================================
echo.
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo.
echo   Presiona cualquier tecla para abrir el navegador...
echo ================================================
pause > nul

:: Abrir navegador
start http://localhost:5173

echo.
echo [INFO] Los servicios estan corriendo en ventanas separadas.
echo [INFO] Cierra esas ventanas para detener los servicios.
echo.
pause