# HexStrike AI 桌面應用程式

HexStrike AI 現在可以打包成桌面應用程式，支援 Windows (.exe)、macOS (.pkg/.dmg) 和 Linux (.deb)！

## 快速開始

詳細的構建指南請參考 [DESKTOP_BUILD.md](DESKTOP_BUILD.md)。

### 快速構建

**Linux/macOS:**
```bash
./scripts/build-desktop.sh
```

**Windows:**
```powershell
.\scripts\build-desktop.ps1
```

## 功能特點

- ✅ 單一應用程式包（前端 + 後端整合）
- ✅ 自動後端進程管理
- ✅ 跨平台支援（Windows、macOS、Linux）
- ✅ 自動後端健康檢查和重啟
- ✅ 原生桌面應用體驗

## 系統需求

- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.15+ (Intel 和 Apple Silicon)
- **Linux**: Ubuntu 20.04+ / Debian 11+ (64-bit)

## 安裝

構建完成後，安裝文件位於 `dist/` 目錄：

- **Windows**: 運行 `.exe` 安裝程式
- **macOS**: 打開 `.dmg` 或運行 `.pkg` 安裝程式
- **Linux**: 使用 `dpkg -i` 安裝 `.deb` 套件

## 注意事項

⚠️ **外部工具依賴**: 應用程式僅打包核心功能。150+ 外部安全工具（如 nmap、nuclei、sqlmap 等）需要使用者預先安裝。

應用程式會自動檢測系統中可用的工具。

## 開發模式

要在開發模式下運行：

```bash
npm run electron:dev
```

## 技術架構

- **前端**: Next.js + Electron
- **後端**: Python Flask + PyInstaller
- **打包工具**: Electron Builder

## 授權

MIT License
