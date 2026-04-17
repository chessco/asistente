# deploy-hostinger.ps1
# Script para compilar y desplegar automáticante el Frontend de CitaIA a Hostinger

Write-Host "Iniciando proceso de despliegue a Hostinger..." -ForegroundColor Cyan

# 1. Navegar a la carpeta web
Set-Location "web"

# 2. Compilar el proyecto
Write-Host "Paso 1: Compilando el Frontend (Vite)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la compilación. Despliegue cancelado." -ForegroundColor Red
    Exit $LASTEXITCODE
}

# 3. Ejecutar el script de despliegue SFTP
Write-Host "Paso 2: Subiendo archivos a Hostinger via SFTP..." -ForegroundColor Yellow
npm run deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error durante la subida de archivos." -ForegroundColor Red
    Exit $LASTEXITCODE
}

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "¡Despliegue finalizado exitosamente! 🚀" -ForegroundColor Green
Write-Host "------------------------------------------------" -ForegroundColor Cyan

Set-Location ".."
