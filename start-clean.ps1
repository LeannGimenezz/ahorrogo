# AhorroGO - Script de inicio para Windows PowerShell
# Ejecutar desde la raiz del proyecto

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  AhorroGO - Iniciar Proyectos" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar directorio
if (-not (Test-Path "backend\app\main.py")) {
    Write-Host "[ERROR] No se encuentra el directorio 'backend'" -ForegroundColor Red
    Write-Host "Asegurate de ejecutar este script desde la raiz del proyecto" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path "frontend\package.json")) {
    Write-Host "[ERROR] No se encuentra el directorio 'frontend'" -ForegroundColor Red
    Write-Host "Asegurate de ejecutar este script desde la raiz del proyecto" -ForegroundColor Red
    pause
    exit 1
}

# Función para verificar si un puerto está en uso
function Test-Port {
    param($Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Verificar puertos
Write-Host "[INFO] Verificando puertos..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "[WARNING] El puerto 8000 ya esta en uso" -ForegroundColor Yellow
}

if (Test-Port 5173) {
    Write-Host "[WARNING] El puerto 5173 ya esta en uso" -ForegroundColor Yellow
}

# Backend
Write-Host ""
Write-Host "[1/4] Configurando Backend..." -ForegroundColor Blue
Set-Location backend

# Verificar/crear entorno virtual
if (-not (Test-Path "venv")) {
    Write-Host "[INFO] Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv venv
}

# Activar y instalar dependencias
Write-Host "[INFO] Instalando dependencias..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt | Out-Null

Write-Host "[OK] Backend configurado" -ForegroundColor Green

# Frontend
Write-Host ""
Write-Host "[2/4] Configurando Frontend..." -ForegroundColor Blue
Set-Location ..\frontend

# Verificar node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependencias de npm..." -ForegroundColor Yellow
    npm install
}

# Limpiar cache de Vite
Write-Host "[INFO] Limpiando cache de Vite..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue

Write-Host "[OK] Frontend configurado" -ForegroundColor Green

# Iniciar Backend
Write-Host ""
Write-Host "[3/4] Iniciando Backend (puerto 8000)..." -ForegroundColor Blue
Set-Location ..\backend

Start-Process -FilePath "powershell" `
    -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" `
    -WindowTitle "AhorroGO - Backend"

Write-Host "[OK] Backend iniciado" -ForegroundColor Green

# Iniciar Frontend
Write-Host ""
Write-Host "[4/4] Iniciando Frontend (puerto 5173)..." -ForegroundColor Blue
Set-Location ..\frontend

Start-Process -FilePath "powershell" `
    -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" `
    -WindowTitle "AhorroGO - Frontend"

Write-Host "[OK] Frontend iniciado" -ForegroundColor Green

# Esperar
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Servicios Iniciados!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs: " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   Frontend: " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Abrir navegador? (s/n): " -NoNewline
$openBrowser = Read-Host
if ($openBrowser -eq "s") {
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Yellow
pause | Out-Null