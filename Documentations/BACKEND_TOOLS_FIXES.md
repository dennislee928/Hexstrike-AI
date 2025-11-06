# 後端安全工具修復方案

## 問題總結

根據 Render 日誌分析，發現以下問題：

### 1. 工具未安裝 (Exit Code 127)
- **Rustscan**: `/bin/sh: 1: rustscan: not found`
- **AutoRecon**: `/bin/sh: 1: autorecon: not found`
- **Dalfox**: `/bin/sh: 1: dalfox: not found`
- **Feroxbuster**: 在某些情況下也未安裝

### 2. 權限問題 (Exit Code 1)
- **Nmap**: `Operation not permitted (1)` - 需要 CAP_NET_RAW 能力來執行 raw socket 操作
  - SYN scans (-sS)
  - OS detection (-O)
  - 某些高級掃描功能

### 3. 命令語法錯誤 (Exit Code 1)
- **Masscan**: `FAIL: unknown command-line parameter "scanme.nmap.org"`
  - 問題：目標被當作位置參數而非選項值
  - 需要修正命令建構邏輯
  
- **Gobuster DNS**: `Incorrect Usage: flag provided but not defined: -u`
  - 問題：DNS 模式使用 `-d` 或 `--domain`，而非 `-u`
  
### 4. 檔案路徑錯誤 (Exit Code 1)
- **Gobuster Dir**: `wordlist file "/usr/share/wordlists/dirb/big.txt.txt" does not exist`
  - 問題：雙重 `.txt.txt` 副檔名

### 5. 系統依賴問題 (Exit Code 127)
- **Amass**: `/usr/bin/amass: 6: sudo: not found`
  - 問題：Amass 腳本嘗試使用 sudo，但容器中未安裝

### 6. 網路超時
- **WPScan**: `Timeout was reached` (Exit Code 1)
- **DNSenum**: 300 秒後超時

---

## 解決方案

### 方案 1: 更新 Dockerfile - 安裝缺失的工具

```dockerfile
# 安裝 Rust 和 Cargo (用於 Rustscan)
RUN apt-get update && apt-get install -y cargo && apt-get clean

# 安裝 Rustscan
RUN cargo install rustscan || echo "Rustscan installation failed, skipping..."

# 安裝 Dalfox (Go tool)
RUN GO111MODULE=on go install github.com/hahwul/dalfox/v2@latest || echo "Dalfox installation failed, skipping..."

# 安裝 AutoRecon (Python tool)
RUN pip install git+https://github.com/Tib3rius/AutoRecon.git || echo "AutoRecon installation failed, skipping..."

# 安裝 Feroxbuster
RUN apt-get update && apt-get install -y feroxbuster || \
    (curl -sL https://github.com/epi052/feroxbuster/releases/latest/download/x86_64-linux-feroxbuster.tar.gz | tar -xzC /usr/local/bin) \
    || echo "Feroxbuster installation failed, skipping..."

# 確保 Go bin 在 PATH 中
ENV PATH="/root/go/bin:${PATH}"
```

### 方案 2: 修正 Nmap 權限問題

有兩個選擇：

#### 選項 A: 使用 CAP_NET_RAW (推薦 - 更安全)
在 `docker-compose.yml` 或 Render 部署設定中：
```yaml
cap_add:
  - NET_RAW
  - NET_ADMIN
```

#### 選項 B: 修改 Nmap 命令，使用不需要 root 的掃描方式
修改 `nmap_tool.py` 和 `hexstrike_server.py`：
```python
# 將 -sS (SYN scan) 替換為 -sT (TCP connect scan)
# 移除 -O (OS detection) 或使用替代方法
SCAN_TYPE_MAPPING = {
    "quick": "-F -sT",  # TCP connect scan (不需要 root)
    "comprehensive": "-sV -sC -A -sT",  # 使用 -sT 替代 -sS
    "stealth": "-sT -T2",  # 使用 TCP connect 而非 SYN
    "udp": "-sU",  # UDP scan (可能仍需要權限)
    "aggressive": "-sV -sC -T4 -sT",  # 移除 -A 中的 OS detection
}
```

### 方案 3: 修正 Masscan 命令語法

修改 `hexstrike_server.py` 中的 Masscan 端點：

```python
@app.route("/api/tools/masscan", methods=["POST"])
def masscan():
    params = request.json
    target = params.get("target", "")
    rate = params.get("rate", 1000)
    ports = params.get("ports", "1-1000")
    
    # 修正：使用正確的語法
    # 錯誤: masscan --rate 1000 -p 1-1000 scanme.nmap.org
    # 正確: masscan scanme.nmap.org --rate 1000 -p 1-1000
    # 或: masscan --rate 1000 -p 1-1000 --range scanme.nmap.org
    
    command = f"masscan {target} --rate {rate} -p {ports}"
    # 或者
    # command = f"masscan --rate {rate} -p {ports} {target}"
```

### 方案 4: 修正 Gobuster 問題

#### 問題 A: DNS 模式參數錯誤
修改 `gobuster_tool.py` 的 `get_command` 方法：

```python
def get_command(self, target: str, parameters: Dict[str, Any] = None) -> str:
    if not parameters:
        parameters = {}
    
    cmd_parts = ["gobuster"]
    mode = parameters.get("mode", "dir")
    cmd_parts.append(mode)
    
    # 根據模式使用不同的參數
    if mode == "dns":
        # DNS 模式使用 -d 或 --domain
        cmd_parts.extend(["-d", shlex.quote(target)])
    elif mode == "vhost":
        # VHOST 模式使用 -u
        cmd_parts.extend(["-u", shlex.quote(target)])
    else:
        # dir, s3 模式使用 -u
        cmd_parts.extend(["-u", shlex.quote(target)])
    
    # wordlist 處理...
```

#### 問題 B: Wordlist 路徑雙重副檔名
檢查並修正 `hexstrike_server.py` 和前端請求：

```python
# 確保預設 wordlist 路徑正確
DEFAULT_WORDLISTS = {
    "common": "/usr/share/wordlists/dirb/common.txt",  # 不是 .txt.txt
    "big": "/usr/share/wordlists/dirb/big.txt",        # 不是 .txt.txt
    "small": "/usr/share/wordlists/dirb/small.txt"
}
```

### 方案 5: 修正 Amass sudo 問題

在 Dockerfile 中安裝 sudo，或修改 Amass 配置：

```dockerfile
# 選項 A: 安裝 sudo
RUN apt-get update && apt-get install -y sudo && apt-get clean

# 選項 B: 確保使用正確的 Amass 版本（不依賴 sudo）
RUN apt-get update && apt-get install -y amass && apt-get clean
```

### 方案 6: 增加 Timeout 設定

修改 `hexstrike_server.py` 中的 timeout 設定：

```python
# WPScan
timeout = params.get("timeout", 600)  # 從 300 增加到 600 秒

# DNSenum
timeout = params.get("timeout", 600)  # 從 300 增加到 600 秒
```

---

## 實施優先順序

### 高優先級（立即修復）
1. ✅ 安裝缺失的工具 (Rustscan, AutoRecon, Dalfox, Feroxbuster)
2. ✅ 修正 Nmap 權限問題（使用 -sT 替代 -sS）
3. ✅ 修正 Gobuster wordlist 路徑
4. ✅ 修正 Gobuster DNS 模式參數

### 中優先級（盡快修復）
5. ⚠️ 修正 Masscan 命令語法
6. ⚠️ 處理 Amass sudo 問題
7. ⚠️ 增加 WPScan/DNSenum timeout

### 低優先級（可選優化）
8. 📝 添加工具可用性檢查（is_available()）
9. 📝 改善錯誤處理和用戶提示
10. 📝 添加 fallback 機制

---

## 測試清單

修復後需要測試：

- [ ] Rustscan 掃描執行
- [ ] AutoRecon 偵察執行
- [ ] Dalfox XSS 掃描
- [ ] Nmap 各種掃描類型（quick, comprehensive, stealth）
- [ ] Masscan 快速掃描
- [ ] Gobuster dir 模式
- [ ] Gobuster dns 模式
- [ ] Amass 子域名枚舉
- [ ] WPScan WordPress 掃描
- [ ] DNSenum DNS 枚舉
- [ ] Nuclei 漏洞掃描

---

## 部署注意事項

### Render 平台限制
1. **容器權限**: Render 可能不允許 CAP_NET_RAW，需使用 TCP connect scans (-sT)
2. **資源限制**: 某些工具（如 Masscan）可能因資源限制而受限
3. **網路限制**: 可能有出站連線限制，影響某些掃描

### 建議配置
1. 使用環境變數控制 tool availability
2. 實作 graceful degradation（工具不可用時的降級策略）
3. 添加清晰的錯誤訊息告知用戶工具狀態

---

## 長期改進建議

1. **工具可用性檢查 API**
   - 新增 `/api/tools/status` 端點
   - 返回所有工具的安裝和可用狀態

2. **動態工具發現**
   - 自動偵測已安裝的工具
   - 根據可用工具動態調整前端 UI

3. **工具版本管理**
   - 記錄所有工具版本
   - 定期更新工具

4. **錯誤恢復機制**
   - 當工具失敗時自動嘗試替代工具
   - 例如：Rustscan 失敗時使用 Nmap

5. **容器化改進**
   - 考慮使用多階段 Docker build
   - 優化 image 大小
   - 改善建構時間

---

## 相關檔案

- `Dockerfile` - 需要更新工具安裝
- `hexstrike_server.py` - 需要修正命令語法和 timeout
- `tools/network/nmap_tool.py` - 需要修正掃描類型
- `tools/network/masscan_tool.py` - 命令建構邏輯
- `tools/web/gobuster_tool.py` - DNS 模式參數修正
- `docker-entrypoint.sh` - 可能需要添加工具檢查

