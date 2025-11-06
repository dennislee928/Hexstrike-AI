# 🧪 HexStrike AI v6.0.1 測試指南

## 測試目的
驗證所有後端工具修復是否成功部署並正常運作。

---

## 前置準備

### 1. 確認部署狀態
```bash
# 檢查 Render 部署狀態
# 前往 https://dashboard.render.com
# 確認 hexstrike-ai 服務狀態為 "Live"
```

### 2. 設定測試環境變數
```bash
export API_BASE_URL="https://hexstrike-ai.dennisleehappy.org"
```

---

## 🔍 測試清單

### 測試 1: 基本健康檢查
**目的**: 確認 API 服務正常運行

```bash
curl -X GET "$API_BASE_URL/health" | jq
```

**預期結果**:
```json
{
  "status": "healthy",
  "message": "HexStrike AI Tools API Server is operational",
  "version": "6.0.0",
  "all_essential_tools_available": true
}
```

**通過標準**: ✅ `status` = "healthy"

---

### 測試 2: 工具狀態檢查（新功能）
**目的**: 驗證所有關鍵工具已安裝並可用

```bash
curl -X GET "$API_BASE_URL/api/tools/status" | jq
```

**預期結果**:
```json
{
  "status": "success",
  "tools": {
    "nmap": {"installed": true, "version": "...", "path": "..."},
    "rustscan": {"installed": true, "version": "...", "path": "..."},
    "dalfox": {"installed": true, "version": "...", "path": "..."},
    "autorecon": {"installed": true, "version": "...", "path": "..."},
    "feroxbuster": {"installed": true, "version": "...", "path": "..."}
  },
  "summary": {
    "total": 15,
    "available": 13,
    "missing": 2,
    "availability_percentage": 86.67
  }
}
```

**通過標準**: 
- ✅ `summary.available` >= 13
- ✅ 以下工具必須 `installed: true`:
  - nmap
  - rustscan
  - dalfox
  - autorecon
  - gobuster
  - nuclei
  - sqlmap

**如果失敗**: 
- 檢查 Render 建構日誌
- 確認 Dockerfile 中的工具安裝步驟
- 查看工具 PATH 環境變數

---

### 測試 3: Nmap 掃描（權限修復驗證）
**目的**: 驗證 Nmap 使用 TCP connect scan (-sT) 正常運行

#### 3.1 Quick Scan
```bash
curl -X POST "$API_BASE_URL/api/tools/nmap" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org",
    "scan_type": "quick"
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "stdout": "...",
  "exit_code": 0,
  "execution_time": "..."
}
```

**通過標準**: 
- ✅ `success` = true
- ✅ `exit_code` = 0
- ❌ 不應出現 "Operation not permitted"
- ❌ 不應出現 "socket troubles"

#### 3.2 Comprehensive Scan
```bash
curl -X POST "$API_BASE_URL/api/tools/nmap" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org",
    "scan_type": "comprehensive"
  }' | jq '.success'
```

**通過標準**: ✅ 回傳 `true`

**如果失敗**:
- 檢查是否仍在使用 -sS 或 -O
- 確認 SCAN_TYPE_MAPPING 已更新
- 查看錯誤訊息是否為權限問題

---

### 測試 4: Rustscan（新安裝工具驗證）
**目的**: 驗證 Rustscan 已正確安裝並可執行

```bash
curl -X POST "$API_BASE_URL/api/tools/rustscan" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org",
    "ulimit": 5000,
    "batch_size": 4500
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ✅ `exit_code` = 0
- ❌ 不應出現 "rustscan: not found"

**如果失敗**:
- 檢查 `which rustscan` 是否在 PATH 中
- 確認 Cargo 安裝成功
- 查看 `/root/.cargo/bin` 是否在 PATH

---

### 測試 5: Gobuster Dir 模式（Wordlist 修復驗證）
**目的**: 驗證 wordlist 路徑不再有雙重 .txt.txt 問題

```bash
curl -X POST "$API_BASE_URL/api/tools/gobuster" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "mode": "dir",
    "wordlist": "common"
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ❌ 不應出現 "big.txt.txt" 或 "common.txt.txt"
- ❌ 不應出現 "no such file or directory"

---

### 測試 6: Gobuster DNS 模式（參數修復驗證）
**目的**: 驗證 DNS 模式使用正確的 -d 參數

```bash
curl -X POST "$API_BASE_URL/api/tools/gobuster" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "example.com",
    "mode": "dns",
    "wordlist": "common",
    "additional_args": "-t 20"
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ❌ 不應出現 "flag provided but not defined: -u"
- ❌ 不應出現 "Incorrect Usage"

---

### 測試 7: Dalfox（新安裝工具驗證）
**目的**: 驗證 Dalfox XSS 掃描工具已安裝

```bash
curl -X POST "$API_BASE_URL/api/tools/dalfox" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://testphp.vulnweb.com/",
    "mining_dom": true
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ❌ 不應出現 "dalfox: not found"

**如果失敗**:
- 檢查 `/root/go/bin/dalfox` 是否存在
- 確認 GOPATH 設定正確
- 查看 Go install 是否成功

---

### 測試 8: AutoRecon（新安裝工具驗證）
**目的**: 驗證 AutoRecon 自動化偵察工具已安裝

```bash
curl -X POST "$API_BASE_URL/api/tools/autorecon" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org",
    "output_dir": "/tmp/autorecon-test"
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ❌ 不應出現 "autorecon: not found"

**注意**: AutoRecon 執行時間較長，可能需要幾分鐘

---

### 測試 9: WPScan（Timeout 修復驗證）
**目的**: 驗證 WPScan 不再因 timeout 失敗

```bash
curl -X POST "$API_BASE_URL/api/tools/wpscan" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://wordpress.org/plugins/",
    "timeout": 600
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "execution_time": "< 600"
}
```

**通過標準**: 
- ✅ `success` = true 或明確的掃描結果
- ❌ 不應在 600 秒內 timeout

**如果 timeout**:
- 增加 timeout 參數到 900
- 檢查目標網站是否可達
- 確認網路連線正常

---

### 測試 10: DNSenum（Timeout 修復驗證）
**目的**: 驗證 DNSenum 不再因 timeout 失敗

```bash
curl -X POST "$API_BASE_URL/api/tools/dnsenum" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "timeout": 600
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "execution_time": "< 600"
}
```

**通過標準**: 
- ✅ 在 600 秒內完成或返回結果
- ❌ 不應在 600 秒時 timeout

---

### 測試 11: Amass（Sudo 依賴修復驗證）
**目的**: 驗證 Amass 不再因缺少 sudo 而失敗

```bash
curl -X POST "$API_BASE_URL/api/tools/amass" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "mode": "enum"
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ❌ 不應出現 "sudo: not found"

---

### 測試 12: Masscan（命令語法驗證）
**目的**: 驗證 Masscan 命令語法正確

```bash
curl -X POST "$API_BASE_URL/api/tools/masscan" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "scanme.nmap.org",
    "ports": "80,443",
    "rate": 1000
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: 
- ✅ `success` = true
- ❌ 不應出現 "unknown command-line parameter"

---

### 測試 13: Nuclei（基準測試）
**目的**: 驗證 Nuclei 正常運行（未修改，作為對照）

```bash
curl -X POST "$API_BASE_URL/api/tools/nuclei" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "severity": "high,critical"
  }' | jq
```

**預期結果**:
```json
{
  "success": true,
  "exit_code": 0
}
```

**通過標準**: ✅ `success` = true

---

## 📊 測試結果記錄

使用此表格記錄測試結果：

| # | 測試項目 | 狀態 | 備註 |
|---|---------|------|------|
| 1 | 健康檢查 | ⬜ |  |
| 2 | 工具狀態 | ⬜ |  |
| 3.1 | Nmap Quick | ⬜ |  |
| 3.2 | Nmap Comprehensive | ⬜ |  |
| 4 | Rustscan | ⬜ |  |
| 5 | Gobuster Dir | ⬜ |  |
| 6 | Gobuster DNS | ⬜ |  |
| 7 | Dalfox | ⬜ |  |
| 8 | AutoRecon | ⬜ |  |
| 9 | WPScan | ⬜ |  |
| 10 | DNSenum | ⬜ |  |
| 11 | Amass | ⬜ |  |
| 12 | Masscan | ⬜ |  |
| 13 | Nuclei | ⬜ |  |

**圖例**: ✅ 通過 | ❌ 失敗 | ⚠️ 部分通過 | ⬜ 未測試

---

## 🐛 常見問題處理

### Q1: 工具顯示 "not found"
**A1**: 
```bash
# 檢查工具是否在 PATH 中
curl -X POST "$API_BASE_URL/api/command" \
  -H "Content-Type: application/json" \
  -d '{"command": "which [工具名稱]"}'

# 檢查 PATH 環境變數
curl -X POST "$API_BASE_URL/api/command" \
  -H "Content-Type: application/json" \
  -d '{"command": "echo $PATH"}'
```

### Q2: Nmap 仍然顯示權限錯誤
**A2**:
```bash
# 檢查使用的掃描類型
curl -X POST "$API_BASE_URL/api/command" \
  -H "Content-Type: application/json" \
  -d '{"command": "nmap --help | grep -A 5 SCAN"}'

# 手動測試 -sT
curl -X POST "$API_BASE_URL/api/command" \
  -H "Content-Type: application/json" \
  -d '{"command": "nmap -sT -F scanme.nmap.org"}'
```

### Q3: Timeout 仍然發生
**A3**:
- 增加 timeout 參數值
- 檢查目標是否可達
- 使用更快的掃描選項

---

## ✅ 驗收標準

### 最低要求（必須全部通過）
- ✅ 測試 1: 健康檢查通過
- ✅ 測試 2: 至少 13/15 工具可用
- ✅ 測試 3.1: Nmap Quick Scan 成功
- ✅ 測試 4: Rustscan 成功
- ✅ 測試 6: Gobuster DNS 成功

### 完整驗收（建議全部通過）
- ✅ 所有 13 項測試通過
- ✅ 無 "not found" 錯誤
- ✅ 無 "permission denied" 錯誤
- ✅ 無 timeout 錯誤（在合理時間內）

---

## 📝 測試報告範本

```markdown
## HexStrike AI v6.0.1 測試報告

**測試日期**: [填寫日期]
**測試人員**: [填寫姓名]
**部署環境**: Render Production

### 測試結果摘要
- 總測試數: 13
- 通過: [數量]
- 失敗: [數量]
- 通過率: [百分比]%

### 關鍵修復驗證
- [ ] Nmap 權限問題已修復
- [ ] Rustscan 已安裝並可用
- [ ] Gobuster DNS 模式已修正
- [ ] Timeout 問題已改善

### 失敗項目（如有）
1. [測試項目] - [原因] - [處理方式]

### 建議
[填寫任何改進建議]

### 結論
[ ] ✅ 通過驗收，可以上線
[ ] ❌ 未通過驗收，需要修復
```

---

**測試時間預估**: 約 30-45 分鐘（包含等待工具執行時間）

**準備好開始測試了嗎？** 從測試 1 開始！🚀

