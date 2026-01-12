# HexStrike AI 桌面應用程式構建指南

本指南說明如何將 HexStrike AI 打包成桌面應用程式（.exe、.pkg/.dmg、.deb）。

## 架構概述

- **前端**: Next.js 應用透過 Electron 打包
- **後端**: Python Flask API 透過 PyInstaller 打包
- **整合**: Electron 應用啟動時自動啟動 Python 後端

## 前置需求

### 所有平台
- Node.js 18+ 
- npm 或 yarn
- Python 3.8+
- pip

### Windows 特定
- Visual Studio Build Tools (用於編譯原生模組)
- Windows 10/11

### macOS 特定
- Xcode Command Line Tools
- macOS 10.15+
- (可選) Apple Developer 帳號用於代碼簽名

### Linux 特定
- build-essential
- fakeroot
- dpkg
- (可選) 用於 .deb 打包的其他工具

## 安裝依賴

### 1. 安裝 Python 依賴
```bash
pip install -r requirements.txt
pip install pyinstaller
```

### 2. 安裝 Node.js 依賴

在專案根目錄：
```bash
npm install
```

在 Front-End 目錄：
```bash
cd Front-End
npm install
cd ..
```

### 3. 安裝 Electron Builder
```bash
npm install -g electron-builder
```

## 準備圖標文件

應用程式需要圖標文件才能正常打包。請將以下文件放在 `electron/icons/` 目錄：

- `icon.ico` - Windows 圖標（256x256 或更大）
- `icon.icns` - macOS 圖標（需要多尺寸）
- `icon.png` - Linux 圖標（512x512 或 1024x1024）
- `dmg-background.png` - macOS DMG 背景（可選，540x380）

如果沒有圖標文件，應用程式仍可構建，但會使用預設圖標。

詳細說明請參考 `electron/icons/README.md`。

## 構建應用程式

### 方法 1: 使用構建腳本（推薦）

#### Linux/macOS:
```bash
./scripts/build-desktop.sh
```

#### Windows:
```powershell
.\scripts\build-desktop.ps1
```

### 方法 2: 手動構建

#### 步驟 1: 構建前端
```bash
cd Front-End
npm install
npm run build
cd ..
```

#### 步驟 2: 構建後端
```bash
python3 -m PyInstaller pyinstaller.spec --clean --noconfirm
# 或 Windows:
python -m PyInstaller pyinstaller.spec --clean --noconfirm
```

#### 步驟 3: 構建 Electron 應用

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

構建輸出將在 `dist/` 目錄中。

## 開發模式

要在開發模式下運行 Electron 應用：

```bash
npm run electron:dev
```

這將：
1. 啟動 Next.js 開發服務器（如果尚未運行）
2. 啟動 Electron 應用
3. 在開發模式下連接前端和後端

**注意**: 開發模式需要手動啟動後端服務器：
```bash
python3 hexstrike_server.py
```

## 輸出文件

構建完成後，輸出文件位於 `dist/` 目錄：

### Windows
- `HexStrike AI-7.0.0-x64.exe` - NSIS 安裝程式
- `HexStrike AI-7.0.0-x64-portable.exe` - 便攜版本

### macOS
- `HexStrike AI-7.0.0-x64.dmg` - DMG 安裝映像
- `HexStrike AI-7.0.0-x64.pkg` - PKG 安裝程式
- `HexStrike AI-7.0.0-arm64.dmg` - Apple Silicon 版本

### Linux
- `hexstrike-ai_7.0.0_amd64.deb` - Debian 套件

## 安裝和運行

### Windows
1. 運行 `.exe` 安裝程式
2. 按照安裝嚮導完成安裝
3. 從開始菜單或桌面快捷方式啟動應用

### macOS
1. 打開 `.dmg` 文件
2. 將應用程式拖到 Applications 文件夾
3. 首次運行時，可能需要在「系統偏好設定 > 安全性與隱私」中允許運行
4. 或使用 `.pkg` 安裝程式進行系統級安裝

### Linux
```bash
sudo dpkg -i hexstrike-ai_7.0.0_amd64.deb
sudo apt-get install -f  # 安裝依賴（如果需要）
hexstrike-ai  # 運行應用
```

## 故障排除

### 後端無法啟動
- 檢查後端可執行檔是否存在於 `dist/` 目錄
- 檢查端口 8888 是否被占用
- 查看 Electron 開發者工具中的控制台錯誤

### 前端無法連接後端
- 確認後端已成功啟動（檢查控制台輸出）
- 確認 API URL 設置為 `http://localhost:8888`
- 檢查防火牆設置

### 構建失敗
- 確保所有依賴已正確安裝
- 檢查 Python 和 Node.js 版本是否符合要求
- 查看構建日誌中的錯誤信息
- 在 Windows 上，確保已安裝 Visual Studio Build Tools

### PyInstaller 錯誤
- 確保所有 Python 依賴已安裝
- 檢查 `pyinstaller.spec` 文件配置
- 嘗試清理構建緩存：`rm -rf build/ dist/`

### Electron Builder 錯誤
- 確保 electron-builder 已正確安裝
- 檢查 `electron-builder.yml` 配置
- 查看 electron-builder 日誌

## 外部工具依賴

**重要**: 應用程式僅打包核心功能。150+ 外部安全工具（如 nmap、nuclei、sqlmap 等）需要使用者預先安裝。

應用程式會自動檢測系統中可用的工具。如果工具未安裝，相關功能將不可用。

## 代碼簽名（可選）

### macOS
要簽名 macOS 應用程式，需要：
1. Apple Developer 帳號
2. 有效的代碼簽名證書
3. 在 `electron-builder.yml` 中配置簽名選項

### Windows
要簽名 Windows 應用程式，需要：
1. 代碼簽名證書（.pfx 文件）
2. 在 `electron-builder.yml` 中配置簽名選項

## 更新應用程式

要更新應用程式版本：
1. 更新 `package.json` 中的 `version` 字段
2. 重新構建應用程式
3. 分發新的安裝文件

## 技術支援

如有問題，請查看：
- [README.md](README.md) - 專案文檔
- [Documentations/](Documentations/) - 詳細文檔
- GitHub Issues - 問題追蹤

## 授權

MIT License - 詳見 LICENSE 文件
