#!/bin/bash
set -e

echo "🚀 Building HexStrike AI Desktop Application"
echo "=============================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查依賴
echo -e "${YELLOW}📦 Checking dependencies...${NC}"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

# 檢查 PyInstaller
PYINSTALLER_CMD=""
if python3 -c "import PyInstaller" 2>/dev/null; then
    PYINSTALLER_CMD="python3 -m PyInstaller"
elif command -v pyinstaller &> /dev/null; then
    PYINSTALLER_CMD="pyinstaller"
elif [ -f ~/.local/bin/pyinstaller ]; then
    PYINSTALLER_CMD="$HOME/.local/bin/pyinstaller"
    echo -e "${YELLOW}⚠️  Using PyInstaller from ~/.local/bin (pipx installation)${NC}"
else
    echo -e "${YELLOW}⚠️  PyInstaller not found. Attempting to install...${NC}"
    pip3 install pyinstaller || {
        echo -e "${RED}❌ Failed to install PyInstaller. Please install manually:${NC}"
        echo -e "   pip3 install pyinstaller"
        echo -e "   OR: pipx install pyinstaller && pipx ensurepath"
        exit 1
    }
    PYINSTALLER_CMD="python3 -m PyInstaller"
fi

# 檢查 Electron Builder
if ! command -v electron-builder &> /dev/null; then
    echo -e "${YELLOW}⚠️  electron-builder not found. Installing...${NC}"
    npm install -g electron-builder
fi

# 構建前端
echo -e "${GREEN}📱 Building frontend...${NC}"
cd Front-End
npm install
npm run build
cd ..

# 構建後端
echo -e "${GREEN}🐍 Building backend...${NC}"
$PYINSTALLER_CMD pyinstaller.spec --clean --noconfirm

# 移動後端可執行檔到構建目錄
mkdir -p dist
if [ -f "dist/hexstrike-server" ]; then
    echo -e "${GREEN}✅ Backend executable created${NC}"
elif [ -f "dist/hexstrike-server.exe" ]; then
    echo -e "${GREEN}✅ Backend executable created${NC}"
else
    echo -e "${YELLOW}⚠️  Backend executable not found in dist/, checking build/...${NC}"
    if [ -f "build/hexstrike-server" ]; then
        cp build/hexstrike-server dist/
    elif [ -f "build/hexstrike-server.exe" ]; then
        cp build/hexstrike-server.exe dist/
    fi
fi

# 安裝 Electron 依賴
echo -e "${GREEN}⚡ Installing Electron dependencies...${NC}"
npm install

# 構建 Electron 應用
echo -e "${GREEN}🔨 Building Electron application...${NC}"

# 檢測平台
PLATFORM=$(uname -s)
if [ "$PLATFORM" == "Darwin" ]; then
    echo -e "${YELLOW}🍎 Building for macOS...${NC}"
    npm run build:mac
elif [ "$PLATFORM" == "Linux" ]; then
    echo -e "${YELLOW}🐧 Building for Linux...${NC}"
    npm run build:linux
else
    echo -e "${RED}❌ Unsupported platform: $PLATFORM${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${GREEN}📦 Output files are in the dist/ directory${NC}"
