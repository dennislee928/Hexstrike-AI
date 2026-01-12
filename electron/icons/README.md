# 應用圖標文件

請將以下圖標文件放在此目錄：

## Windows
- `icon.ico` - Windows 應用圖標（256x256 或更大，多尺寸）

## macOS
- `icon.icns` - macOS 應用圖標（需要多尺寸：16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024）

## Linux
- `icon.png` - Linux 應用圖標（512x512 或 1024x1024）

## macOS DMG 背景
- `dmg-background.png` - DMG 安裝程式背景圖片（540x380 或更大）

## 圖標生成工具

### 從 PNG 生成 ICO (Windows)
```bash
# 使用 ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# 或使用在線工具
# https://convertio.co/png-ico/
```

### 從 PNG 生成 ICNS (macOS)
```bash
# 使用 iconutil (macOS 內建)
mkdir icon.iconset
# 創建不同尺寸的圖標
# 然後運行：
iconutil -c icns icon.iconset -o icon.icns

# 或使用在線工具
# https://cloudconvert.com/png-to-icns
```

## 臨時解決方案

如果暫時沒有圖標文件，electron-builder 會使用預設圖標。應用程式仍然可以正常構建和運行。
