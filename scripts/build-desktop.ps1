# HexStrike AI Desktop Application Build Script for Windows
# PowerShell script for building the desktop application

Write-Host "🚀 Building HexStrike AI Desktop Application" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# 檢查依賴
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow

# 檢查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# 檢查 Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# 檢查 PyInstaller
try {
    python -c "import PyInstaller" 2>$null
    Write-Host "✅ PyInstaller found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PyInstaller not found. Installing..." -ForegroundColor Yellow
    pip install pyinstaller
}

# 檢查 Electron Builder
if (!(Get-Command electron-builder -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  electron-builder not found. Installing..." -ForegroundColor Yellow
    npm install -g electron-builder
}

# 構建前端
Write-Host "`n📱 Building frontend..." -ForegroundColor Green
Set-Location Front-End
npm install
npm run build
Set-Location ..

# 構建後端
Write-Host "`n🐍 Building backend..." -ForegroundColor Green
python -m PyInstaller pyinstaller.spec --clean --noconfirm

# 移動後端可執行檔到構建目錄
if (!(Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist"
}

if (Test-Path "dist\hexstrike-server.exe") {
    Write-Host "✅ Backend executable created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend executable not found in dist/, checking build/..." -ForegroundColor Yellow
    if (Test-Path "build\hexstrike-server.exe") {
        Copy-Item "build\hexstrike-server.exe" "dist\"
    }
}

# 安裝 Electron 依賴
Write-Host "`n⚡ Installing Electron dependencies..." -ForegroundColor Green
npm install

# 構建 Electron 應用
Write-Host "`n🔨 Building Electron application for Windows..." -ForegroundColor Green
npm run build:win

Write-Host "`n✅ Build complete!" -ForegroundColor Green
Write-Host "📦 Output files are in the dist/ directory" -ForegroundColor Green
