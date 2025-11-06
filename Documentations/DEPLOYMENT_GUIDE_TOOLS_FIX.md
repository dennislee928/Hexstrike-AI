# HexStrike AI 後端工具修復部署指南

## 📋 修復總覽

此次更新解決了 Render 部署環境中多個安全工具的執行問題，包括工具缺失、權限問題、命令語法錯誤和超時設定。

### 修復版本
- **版本**: 6.0.1
- **日期**: 2025-11-04
- **狀態**: 已完成修復，待部署測試

---

## 🛠️ 修復內容詳細清單

### 1. ✅ 安裝缺失的安全工具

#### 問題
以下工具在容器中未安裝，導致 Exit Code 127 錯誤：
- Rustscan (超快速端口掃描器)
- AutoRecon (自動化偵察工具)
- Dalfox (XSS 掃描工具)
- Feroxbuster (目錄爆破工具)

#### 解決方案
更新 `Dockerfile`，添加以下安裝步驟：

```dockerfile
# 安裝 Rust 和 Cargo（用於 Rustscan）
RUN apt-get update && apt-get install -y \
    cargo \
    rustc \
    && apt-get clean

# 安裝 Rustscan
RUN cargo install rustscan || echo "⚠️ Rustscan installation failed, continuing..."

# 安裝 Dalfox（Go 工具）
RUN GO111MODULE=on go install github.com/hahwul/dalfox/v2@latest

# 安裝 Feroxbuster
RUN curl -sL https://github.com/epi052/feroxbuster/releases/download/v2.10.1/x86_64-linux-feroxbuster.tar.gz | tar -xzC /usr/local/bin

# 安裝 AutoRecon（Python 工具）
RUN pip install --no-cache-dir git+https://github.com/Tib3rius/AutoRecon.git
```

#### 影響的檔案
- `Dockerfile` (新增安裝步驟)

---

### 2. ✅ 修正 Nmap 權限問題

#### 問題
Nmap 掃描失敗並顯示錯誤：
```
socket troubles in HostOsScan: Operation not permitted (1)
Couldn't open a raw socket. Error: Operation not permitted (1)
```

這是因為某些 Nmap 掃描類型（-sS SYN scan, -O OS detection）需要 CAP_NET_RAW 權限，但容器以非 root 用戶運行。

#### 解決方案
修改 `hexstrike_server.py` 中的 `SCAN_TYPE_MAPPING`，使用不需要 root 權限的掃描方式：

**修改前：**
```python
SCAN_TYPE_MAPPING = {
    "quick": "-F -sT",
    "comprehensive": "-sV -sC -A -sT",  # -A 包含 -O (需要 root)
    "stealth": "-sS -T2",  # -sS 需要 root
    "aggressive": "-A -T4",  # -A 包含 -O (需要 root)
}
```

**修改後：**
```python
SCAN_TYPE_MAPPING = {
    "quick": "-F -sT",  # TCP connect scan
    "comprehensive": "-sV -sC -sT -T4",  # 移除 -A (OS detection)
    "stealth": "-sT -T2",  # 使用 TCP connect 替代 SYN scan
    "udp": "-sU",
    "aggressive": "-sV -sC -T4 -sT",  # 移除 -A
}
```

#### 影響的檔案
- `hexstrike_server.py` (SCAN_TYPE_MAPPING 定義)

#### 注意事項
- TCP connect scan (-sT) 比 SYN scan (-sS) 慢，但不需要特殊權限
- 無法執行 OS detection (-O)，但其他功能正常
- 如果需要完整功能，需要在 Render 設定中添加 `CAP_NET_RAW` capability（如果支援）

---

### 3. ✅ 修正 Gobuster 命令語法錯誤

#### 問題 A: DNS 模式使用錯誤參數
Gobuster DNS 模式失敗：
```
Incorrect Usage: flag provided but not defined: -u
```

#### 問題 B: Wordlist 路徑雙重副檔名
```
wordlist file "/usr/share/wordlists/dirb/big.txt.txt" does not exist
```

#### 解決方案

**A. 修正 DNS 模式參數**

更新 `hexstrike_server.py` 和 `tools/web/gobuster_tool.py`：

```python
# 根據模式使用不同的參數
if mode == "dns":
    # DNS 模式使用 -d 或 --domain
    command = f"gobuster {mode} -d {url} -w {wordlist}"
elif mode == "vhost" or mode == "dir" or mode == "fuzz":
    # VHOST, DIR, FUZZ 模式使用 -u
    command = f"gobuster {mode} -u {url} -w {wordlist}"
```

**B. 修正 Wordlist 路徑**

```python
# 避免雙重 .txt 副檔名
if wordlist and "/" not in wordlist:
    if not wordlist.endswith('.txt'):
        wordlist = f"/usr/share/wordlists/dirb/{wordlist}.txt"
    else:
        wordlist = f"/usr/share/wordlists/dirb/{wordlist}"
```

#### 影響的檔案
- `hexstrike_server.py` (Gobuster 端點)
- `tools/web/gobuster_tool.py` (get_command 方法)

---

### 4. ✅ 增加 WPScan 和 DNSenum 超時設定

#### 問題
WPScan 和 DNSenum 經常因為預設 timeout (300秒) 不足而失敗。

#### 解決方案

**A. 更新 execute_command 函數支援 timeout 參數**

```python
def execute_command(command: str, use_cache: bool = True, timeout: int = None) -> Dict[str, Any]:
    # Execute command with optional timeout
    if timeout:
        executor = EnhancedCommandExecutor(command, timeout=timeout)
    else:
        executor = EnhancedCommandExecutor(command)
    result = executor.execute()
```

**B. 更新 WPScan 端點**

```python
@app.route("/api/tools/wpscan", methods=["POST"])
def wpscan():
    params = request.json
    timeout = params.get("timeout", 600)  # 預設 10 分鐘
    command = f"wpscan --url {url} --request-timeout 120 --connect-timeout 30"
    result = execute_command(command, timeout=timeout)
```

**C. 更新 DNSenum 端點**

```python
@app.route("/api/tools/dnsenum", methods=["POST"])
def dnsenum():
    params = request.json
    timeout = params.get("timeout", 600)  # 預設 10 分鐘
    command = f"dnsenum {domain} --threads 5"  # 限制執行緒數
    result = execute_command(command, timeout=timeout)
```

#### 影響的檔案
- `hexstrike_server.py` (execute_command, WPScan, DNSenum 端點)

---

### 5. ✅ 處理 Amass sudo 依賴問題

#### 問題
Amass 執行失敗：
```
/usr/bin/amass: 6: sudo: not found
```

#### 解決方案
在 Dockerfile 中安裝 sudo：

```dockerfile
# 安裝基礎工具
RUN apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    git \
    curl \
    wget \
    unzip \
    sudo \
    build-essential \
    libssl-dev \
    libffi-dev
```

#### 影響的檔案
- `Dockerfile`

---

### 6. ✅ 新增工具狀態檢查 API

#### 新功能
添加 `/api/tools/status` 端點，提供詳細的工具安裝狀態和版本資訊。

#### API 回應範例
```json
{
  "status": "success",
  "timestamp": "2025-11-04T10:00:00",
  "tools": {
    "nmap": {
      "installed": true,
      "version": "Nmap version 7.94",
      "path": "/usr/bin/nmap"
    },
    "rustscan": {
      "installed": true,
      "version": "rustscan 2.1.1",
      "path": "/root/.cargo/bin/rustscan"
    },
    "dalfox": {
      "installed": true,
      "version": "dalfox v2.9.0",
      "path": "/root/go/bin/dalfox"
    }
  },
  "summary": {
    "total": 15,
    "available": 14,
    "missing": 1,
    "availability_percentage": 93.33
  }
}
```

#### 使用方式
```bash
# 檢查工具狀態
curl https://hexstrike-ai.dennisleehappy.org/api/tools/status
```

#### 影響的檔案
- `hexstrike_server.py` (新增 /api/tools/status 端點)

---

## 🚀 部署步驟

### 步驟 1: 準備代碼
```bash
# 確認所有修改已提交
git status

# 如有未提交的修改，進行提交
git add .
git commit -m "fix: 修復後端安全工具執行問題 (v6.0.1)"
git push origin main
```

### 步驟 2: Render 部署
1. 登入 Render Dashboard: https://dashboard.render.com
2. 找到 `hexstrike-ai` 服務
3. 點擊 "Manual Deploy" > "Deploy latest commit"
4. 等待建構完成（預計 15-20 分鐘，因為需要安裝額外工具）

### 步驟 3: 驗證部署

#### A. 檢查服務健康狀態
```bash
curl https://hexstrike-ai.dennisleehappy.org/health
```

預期回應：
```json
{
  "status": "healthy",
  "message": "HexStrike AI Tools API Server is operational",
  "version": "6.0.0"
}
```

#### B. 檢查工具狀態
```bash
curl https://hexstrike-ai.dennisleehappy.org/api/tools/status
```

預期：至少 13/15 工具可用（某些 Go 工具可能需要額外時間安裝）

#### C. 測試關鍵工具

**測試 Nmap (修正後的掃描類型)**
```bash
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/nmap \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org",
    "scan_type": "quick"
  }'
```

**測試 Gobuster DNS 模式（修正後）**
```bash
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/gobuster \
  -H "Content-Type: application/json" \
  -d '{
    "url": "example.com",
    "mode": "dns",
    "wordlist": "common"
  }'
```

**測試 Rustscan（新安裝）**
```bash
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/rustscan \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org"
  }'
```

### 步驟 4: 監控日誌
在 Render Dashboard 中查看即時日誌：
1. 進入服務詳情頁
2. 點擊 "Logs" 標籤
3. 觀察工具執行情況
4. 確認沒有 "not found" 或 "permission denied" 錯誤

---

## 📊 預期改進

### 修復前 vs 修復後

| 工具 | 修復前狀態 | 修復後狀態 | 改進 |
|------|-----------|-----------|------|
| Nmap | ❌ Permission denied | ✅ 正常運行（使用 -sT） | 🟢 |
| Rustscan | ❌ Not found (127) | ✅ 已安裝 | 🟢 |
| AutoRecon | ❌ Not found (127) | ✅ 已安裝 | 🟢 |
| Dalfox | ❌ Not found (127) | ✅ 已安裝 | 🟢 |
| Feroxbuster | ❌ Not found (127) | ✅ 已安裝 | 🟢 |
| Masscan | ⚠️ 語法錯誤 | ✅ 正常運行 | 🟡 |
| Gobuster dir | ⚠️ Wordlist 路徑錯誤 | ✅ 已修正 | 🟢 |
| Gobuster dns | ❌ 錯誤參數 | ✅ 已修正 | 🟢 |
| Amass | ❌ sudo not found | ✅ 已安裝 sudo | 🟢 |
| WPScan | ⚠️ Timeout | ✅ 增加 timeout | 🟢 |
| DNSenum | ⚠️ Timeout | ✅ 增加 timeout | 🟢 |
| Nuclei | ✅ 正常 | ✅ 正常 | - |
| SQLMap | ✅ 正常 | ✅ 正常 | - |

---

## 🔍 測試清單

部署後請執行以下測試：

- [ ] 測試 Nmap 快速掃描
- [ ] 測試 Nmap 完整掃描（comprehensive）
- [ ] 測試 Rustscan 端口掃描
- [ ] 測試 AutoRecon 自動偵察
- [ ] 測試 Gobuster dir 模式
- [ ] 測試 Gobuster dns 模式
- [ ] 測試 Dalfox XSS 掃描
- [ ] 測試 Masscan 快速掃描
- [ ] 測試 Amass 子域名枚舉
- [ ] 測試 WPScan（使用實際 WordPress 網站）
- [ ] 測試 DNSenum DNS 枚舉
- [ ] 測試 Nuclei 漏洞掃描
- [ ] 檢查 `/api/tools/status` 端點
- [ ] 檢查 `/health` 端點

---

## ⚠️ 已知限制

### 1. Nmap 功能限制
- **無法使用**: SYN scan (-sS), OS detection (-O)
- **原因**: 需要 CAP_NET_RAW 權限
- **替代方案**: 使用 TCP connect scan (-sT)
- **影響**: 掃描速度稍慢，但功能正常

### 2. 建構時間增加
- **原因**: 需要安裝 Rust, Cargo, Go 工具鏈
- **預期時間**: 首次建構約 15-20 分鐘
- **後續建構**: 使用快取，約 5-10 分鐘

### 3. 容器大小增加
- **修復前**: 約 2.5 GB
- **修復後**: 約 3.5 GB
- **原因**: 額外的工具和依賴

### 4. Render 平台限制
- 某些工具可能因資源限制而受限
- 網路掃描可能因出站限制而受影響
- 建議使用 Render 的 Pro 方案以獲得更好性能

---

## 🐛 故障排除

### 問題 1: 工具仍然顯示 "not found"
**解決方案：**
```bash
# 檢查 PATH 環境變數
echo $PATH

# 確認工具安裝位置
which rustscan
which dalfox

# 如果在非標準位置，檢查 Dockerfile 的 ENV PATH 設定
```

### 問題 2: Nmap 仍然顯示權限錯誤
**解決方案：**
- 確認使用的是修復後的掃描類型（quick, comprehensive）
- 避免手動指定 -sS 或 -O 參數
- 檢查 SCAN_TYPE_MAPPING 是否正確更新

### 問題 3: Timeout 仍然發生
**解決方案：**
```bash
# 增加 timeout 參數
curl -X POST .../api/tools/wpscan \
  -d '{"url": "...", "timeout": 900}'  # 15 分鐘
```

### 問題 4: 建構失敗
**可能原因：**
- Rust/Cargo 安裝失敗
- Go 工具安裝失敗
- 網路連線問題

**解決方案：**
- 檢查 Render 建構日誌
- 確認 Dockerfile 中的 `|| echo "continuing..."` 容錯機制
- 必要時可以暫時移除有問題的工具安裝步驟

---

## 📞 支援資訊

### 相關文件
- `BACKEND_TOOLS_FIXES.md` - 詳細技術修復說明
- `CORS_FIX_COMPLETE.md` - CORS 問題修復文件
- `Dockerfile` - 容器配置
- `hexstrike_server.py` - 後端 API 實作

### 聯絡方式
如遇到問題，請查看：
1. Render Dashboard 日誌
2. GitHub Issues
3. 本專案 README.md

---

## 📝 更新日誌

### v6.0.1 (2025-11-04)
- ✅ 安裝 Rustscan, AutoRecon, Dalfox, Feroxbuster
- ✅ 修正 Nmap 權限問題（使用 TCP connect scan）
- ✅ 修正 Gobuster DNS 模式參數
- ✅ 修正 Gobuster wordlist 路徑問題
- ✅ 增加 WPScan/DNSenum timeout
- ✅ 安裝 sudo 解決 Amass 依賴
- ✅ 新增 /api/tools/status 端點

### v6.0.0 (2025-11-03)
- 初始版本
- CORS 問題修復

---

## 🎯 下一步

1. ✅ 部署到 Render
2. ⏳ 執行完整測試
3. ⏳ 監控工具執行狀況
4. ⏳ 根據實際情況調整 timeout 和參數
5. ⏳ 考慮優化 Docker image 大小
6. ⏳ 評估是否需要升級 Render 方案

---

**準備好部署了嗎？** 🚀

如果所有修改都已就緒，請執行：
```bash
git push origin main
```

然後在 Render Dashboard 點擊 "Manual Deploy"！

