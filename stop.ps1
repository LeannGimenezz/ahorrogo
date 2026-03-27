# AhorroGO - Detener Servicios
# Ejecutar para detener todos los servicios

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  AhorroGO - Detener Servicios" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deteniendo servicios..." -ForegroundColor Yellow

# Detener Backend
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like "*uvicorn*" -or $_.MainWindowTitle -like "*AhorroGO*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Detener Frontend
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like "*vite*" -or $_.MainWindowTitle -like "*AhorroGO*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Cerrar ventanas de PowerShell con títulos de AhorroGO
$shellApp = New-Object -ComObject Shell.Application
$windows = $shellApp.Windows() | Where-Object { 
    $_.LocationName -like "*AhorroGO*" 
}

Write-Host ""
Write-Host "[OK] Servicios detenidos" -ForegroundColor Green
Write-Host ""
pause