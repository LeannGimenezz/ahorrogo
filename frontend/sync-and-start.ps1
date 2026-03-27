# Script para sincronizar y reiniciar el frontend AhorroGO
# Ejecuta este script si tienes errores de import

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  AhorroGO - Sincronizar y Reiniciar Frontend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = "C:\Users\leang\Desktop\ahorrogo\frontend"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path $frontendPath)) {
    Write-Host "[ERROR] No se encuentra el directorio del frontend" -ForegroundColor Red
    pause
    exit 1
}

Set-Location $frontendPath

# Paso 1: Limpiar caché de Vite
Write-Host "[1/4] Limpiando cache de Vite..." -ForegroundColor Yellow

$viteCachePath = Join-Path $frontendPath ".vite"
$nodeModulesVitePath = Join-Path $frontendPath "node_modules\.vite"

if (Test-Path $viteCachePath) {
    Remove-Item -Recurse -Force $viteCachePath -ErrorAction SilentlyContinue
    Write-Host "  - Eliminado .vite" -ForegroundColor Green
}

if (Test-Path $nodeModulesVitePath) {
    Remove-Item -Recurse -Force $nodeModulesVitePath -ErrorAction SilentlyContinue
    Write-Host "  - Eliminado node_modules\.vite" -ForegroundColor Green
}

# Paso 2: Verificar archivos de autenticación
Write-Host ""
Write-Host "[2/4] Verificando archivos..." -ForegroundColor Yellow

$authProviderPath = "src\components\auth\AuthProvider.tsx"
$protectedRoutePath = "src\components\auth\ProtectedRoute.tsx"
$hooksIndexPath = "src\hooks\index.ts"

$filesToCheck = @($authProviderPath, $protectedRoutePath, $hooksIndexPath)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  FALTA: $file" -ForegroundColor Red
    }
}

# Paso 3: Verificar imports
Write-Host ""
Write-Host "[3/4] Verificando imports..." -ForegroundColor Yellow

$authProviderContent = Get-Content $authProviderPath -Raw
if ($authProviderContent -match '\.\./hooks/useAuth') {
    Write-Host "  ERROR: Import incorrecto en AuthProvider.tsx" -ForegroundColor Red
    Write-Host "  Debe ser '../../hooks/useAuth' no '../hooks/useAuth'" -ForegroundColor Red
} elseif ($authProviderContent -match '\.\./\.\./hooks/useAuth') {
    Write-Host "  OK: Import correcto en AuthProvider.tsx" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No se encontro import de useAuth" -ForegroundColor Yellow
}

# Paso 4: Iniciar Vite
Write-Host ""
Write-Host "[4/4] Iniciando Vite..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Vite iniciando en http://localhost:5173" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

npm run dev