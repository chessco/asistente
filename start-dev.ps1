# Start-Dev.ps1
# Script to launch CitaIA by Pitaya Schedly in separate development windows

Write-Host "Launching CitaIA Development Environment..." -ForegroundColor Cyan

# 0. Clean up existing processes on port 3013 and 3000
Write-Host "Cleaning up existing ports (3013 & 3000)..." -ForegroundColor Gray
$apiPid = Get-NetTCPConnection -LocalPort 3013 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($apiPid) { Stop-Process -Id $apiPid -Force }

$webPid = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($webPid) { Stop-Process -Id $webPid -Force }

# 1. Ensure Dependencies are installed in both folders
if (!(Test-Path "api/node_modules")) {
    Write-Host "Installing Backend dependencies..." -ForegroundColor Yellow
    Set-Location "api"
    npm install
    Set-Location ".."
}

if (!(Test-Path "web/node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
    Set-Location "web"
    npm install
    Set-Location ".."
}

# 2. Launch Backend (API) in a new window
Write-Host "Starting CitaIA Backend on http://localhost:3013..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; npm run dev"

# 3. Launch Frontend (WEB) in a new window
Write-Host "Starting CitaIA Web on http://localhost:3000..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; npm run dev"

Write-Host "Both CitaIA environments are launching! Check the new windows for logs." -ForegroundColor Cyan
