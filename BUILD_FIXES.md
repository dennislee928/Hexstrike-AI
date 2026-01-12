# 構建問題修復指南

## PyInstaller 安裝問題

如果您通過 `pipx` 安裝了 PyInstaller，可能會遇到路徑問題。

### 解決方案 1: 添加 PATH（推薦）

運行以下命令將 pipx 的 bin 目錄添加到 PATH：

```bash
pipx ensurepath
```

然後重新啟動終端或運行：
```bash
source ~/.zshrc  # 或 ~/.bashrc
```

### 解決方案 2: 使用 Python 模組方式安裝

如果您希望使用 `python3 -m PyInstaller`，需要將 PyInstaller 作為 Python 模組安裝：

```bash
pip3 install pyinstaller
```

### 解決方案 3: 使用構建腳本（已更新）

構建腳本 (`scripts/build-desktop.sh`) 已經更新，會自動檢測並使用以下方式（按優先順序）：

1. `python3 -m PyInstaller`（如果 PyInstaller 作為 Python 模組安裝）
2. `pyinstaller`（如果在 PATH 中）
3. `~/.local/bin/pyinstaller`（pipx 安裝位置）

## npm 網絡錯誤

如果遇到 npm install 網絡錯誤（ECONNRESET），可以嘗試：

### 解決方案 1: 重試

```bash
npm install --registry https://registry.npmjs.org/
```

### 解決方案 2: 使用不同的 registry

```bash
npm install --registry https://registry.npmmirror.com/
```

### 解決方案 3: 檢查代理設置

```bash
npm config get proxy
npm config get https-proxy
```

如果需要設置代理：
```bash
npm config set proxy http://proxy.example.com:8080
npm config set https-proxy http://proxy.example.com:8080
```

### 解決方案 4: 清除 npm 緩存

```bash
npm cache clean --force
npm install
```

## 驗證安裝

運行以下命令驗證所有依賴是否正確安裝：

```bash
# 檢查 Python 和 PyInstaller
python3 --version
python3 -c "import PyInstaller; print('PyInstaller OK')" || pyinstaller --version || ~/.local/bin/pyinstaller --version

# 檢查 Node.js 和 npm
node --version
npm --version

# 檢查 Electron Builder（如果全局安裝）
electron-builder --version
```

## 構建順序

建議的構建順序：

1. 安裝 Python 依賴
2. 安裝 Node.js 依賴（根目錄）
3. 安裝前端依賴（Front-End 目錄）
4. 運行構建腳本

```bash
# 1. Python 依賴
pip3 install -r requirements.txt
pip3 install pyinstaller  # 或使用 pipx

# 2. 根目錄 Node.js 依賴
npm install

# 3. 前端依賴
cd Front-End
npm install
cd ..

# 4. 構建
./scripts/build-desktop.sh
```
