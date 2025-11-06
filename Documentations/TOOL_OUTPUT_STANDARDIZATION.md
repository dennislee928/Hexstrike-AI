# 🎯 安全工具輸出標準化方案

## 問題描述

許多安全工具產生的輸出對前端不友善：
- **互動式提示** (SQLMap, Hydra, John, etc.)
- **非結構化輸出** (純文本、ASCII art)
- **外部文件引用** (CSV, XML, JSON 文件)
- **冗長技術細節** (淹沒關鍵資訊)

---

## 🔧 解決方案架構

### 第 1 層：工具執行優化
為互動式工具添加自動回答參數

### 第 2 層：輸出解析器
智能提取關鍵資訊並結構化

### 第 3 層：統一響應格式
所有工具返回一致的 JSON 結構

---

## 📋 問題工具清單

### 高優先級（嚴重影響 UX）

| 工具 | 問題類型 | 嚴重度 |
|------|---------|--------|
| **SQLMap** | 互動提示 + CSV 輸出 | 🔴 高 |
| **Hydra** | 互動密碼確認 | 🔴 高 |
| **John** | 進度輸出混亂 | 🟡 中 |
| **Hashcat** | 進度條 + 狀態文件 | 🟡 中 |
| **WPScan** | JSON + 文本混合 | 🟡 中 |
| **Nikto** | HTML/CSV 輸出選項 | 🟢 低 |
| **Nuclei** | JSONL 流式輸出 | 🟢 低 |

---

## 🛠️ 具體修復方案

### 1. SQLMap 優化

#### 問題
```
do you want to test this URL? [Y/n/q]
> Y
Do you want to use those [Y/n] Y
how do you want to proceed? [(C)ontinue/(s)tring/(r)egex/(q)uit] C
```

#### 解決方案
```python
# 添加批次模式參數
sqlmap_params = [
    "--batch",              # 永不詢問用戶輸入
    "--flush-session",      # 清除之前的會話
    "--crawl=0",           # 禁用爬蟲（減少提示）
    "--forms",             # 自動測試表單
    "--parse-errors",      # 解析錯誤訊息
    "--output-dir=/tmp/sqlmap",  # 指定輸出目錄
]
```

#### 輸出解析器
```python
def parse_sqlmap_output(stdout: str) -> dict:
    """解析 SQLMap 輸出並提取關鍵資訊"""
    
    result = {
        "vulnerable": False,
        "injection_points": [],
        "dbms": None,
        "vulnerabilities_found": 0,
        "test_summary": {},
        "recommendations": []
    }
    
    # 檢測注入點
    if "Parameter:" in stdout and "is vulnerable" in stdout:
        result["vulnerable"] = True
        # 提取注入點資訊
        for line in stdout.split('\n'):
            if "Parameter:" in line:
                result["injection_points"].append(line.strip())
    
    # 檢測資料庫類型
    if "back-end DBMS:" in stdout:
        dbms_match = re.search(r'back-end DBMS: (.+)', stdout)
        if dbms_match:
            result["dbms"] = dbms_match.group(1).strip()
    
    # 檢測測試狀態
    if "all tested parameters do not appear to be injectable" in stdout:
        result["test_summary"]["status"] = "clean"
        result["test_summary"]["message"] = "未發現注入漏洞"
    
    # 提取建議
    if "Try to increase values for '--level'/'--risk'" in stdout:
        result["recommendations"].append("嘗試提高 --level 和 --risk 參數值")
    
    if "maybe you could try to use option '--tamper'" in stdout:
        result["recommendations"].append("可能有 WAF 保護，建議使用 --tamper 參數")
    
    return result
```

---

### 2. Hydra 優化

#### 問題
```
The target requires authentication. Continue? [Y/n]
```

#### 解決方案
```python
hydra_params = [
    "-f",                   # 找到第一個密碼後停止
    "-V",                   # 詳細輸出但不互動
    "-o", "/tmp/hydra.txt", # 輸出到文件
]
```

---

### 3. John the Ripper 優化

#### 問題
進度輸出混亂，難以解析

#### 解決方案
```python
john_params = [
    "--format=raw-md5",     # 明確指定格式
    "--wordlist=/usr/share/wordlists/rockyou.txt",
    "--pot=/tmp/john.pot",  # 指定 pot 文件位置
    "--session=/tmp/john_session",
]

def parse_john_output(stdout: str) -> dict:
    """解析 John 輸出"""
    result = {
        "cracked": [],
        "progress": {
            "tested": 0,
            "speed": "0 p/s",
            "remaining": "unknown"
        },
        "success_rate": 0
    }
    
    # 解析已破解的密碼
    for line in stdout.split('\n'):
        if ":" in line and not line.startswith('['):
            parts = line.split(':')
            if len(parts) >= 2:
                result["cracked"].append({
                    "hash": parts[0],
                    "password": parts[1]
                })
    
    return result
```

---

### 4. Hashcat 優化

#### 問題
進度條和狀態輸出

#### 解決方案
```python
hashcat_params = [
    "--quiet",              # 靜默模式
    "--potfile-disable",    # 禁用 pot 文件
    "--outfile=/tmp/hashcat.out",
    "--outfile-format=2",   # plain:hash 格式
    "--status",             # 顯示狀態
    "--status-timer=1",     # 每秒更新
]
```

---

## 🎨 統一輸出格式

### 標準響應結構

```typescript
interface ToolResponse {
  // 基本資訊
  success: boolean;
  tool: string;
  target: string;
  timestamp: string;
  execution_time: number;
  
  // 結果摘要（關鍵！）
  summary: {
    status: "vulnerable" | "clean" | "error" | "partial";
    findings_count: number;
    severity: "critical" | "high" | "medium" | "low" | "info";
    brief: string;  // 一句話摘要
  };
  
  // 詳細發現
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    evidence?: string;
    recommendation?: string;
  }>;
  
  // 原始輸出（可選，供進階用戶查看）
  raw_output?: {
    stdout: string;
    stderr: string;
    return_code: number;
  };
  
  // 元數據
  metadata: {
    parameters_used: object;
    warnings: string[];
    next_steps: string[];
  };
}
```

---

## 📝 實作清單

### Phase 1: 緊急修復（當前）
- [x] SQLMap 批次模式
- [ ] 添加 SQLMap 輸出解析器
- [ ] 標準化 SQLMap 響應格式

### Phase 2: 常用工具（本週）
- [ ] Hydra 自動確認
- [ ] Nikto 輸出解析
- [ ] WPScan JSON 模式
- [ ] Nuclei 輸出標準化

### Phase 3: 進階工具（下週）
- [ ] John/Hashcat 進度追蹤
- [ ] Nmap XML 解析增強
- [ ] Gobuster 結構化輸出
- [ ] Ffuf JSON 模式

---

## 🚀 快速部署

### 文件結構
```
tools/
├── parsers/
│   ├── __init__.py
│   ├── sqlmap_parser.py
│   ├── hydra_parser.py
│   ├── nmap_parser.py
│   └── base_parser.py
│
├── formatters/
│   ├── __init__.py
│   └── standard_response.py
│
└── configs/
    ├── sqlmap_config.py
    ├── hydra_config.py
    └── tool_defaults.py
```

---

## 📊 預期改進

| 指標 | 修復前 | 修復後 | 改進 |
|------|--------|--------|------|
| 需要手動輸入 | 3-5 次 | 0 次 | 100% |
| 關鍵資訊可見度 | 20% | 95% | +375% |
| JSON 結構化程度 | 30% | 100% | +233% |
| 前端可用性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | +150% |

---

## 🎯 範例：SQLMap 修復前後對比

### 修復前
```json
{
  "stdout": "[大量文本輸出，包含互動提示]",
  "stderr": "",
  "success": true,
  "execution_time": 26.28
}
```

### 修復後
```json
{
  "success": true,
  "tool": "sqlmap",
  "target": "https://streetvoice.com/",
  "execution_time": 26.28,
  
  "summary": {
    "status": "clean",
    "findings_count": 0,
    "severity": "info",
    "brief": "未發現 SQL 注入漏洞（已測試 5 個參數）"
  },
  
  "findings": [],
  
  "metadata": {
    "parameters_tested": 5,
    "techniques_used": ["boolean-based", "time-based", "error-based"],
    "waf_detected": false,
    "warnings": [
      "目標內容不穩定，可能影響測試準確性"
    ],
    "next_steps": [
      "嘗試增加 --level 和 --risk 參數",
      "考慮使用 --tamper 繞過保護"
    ]
  },
  
  "raw_output": {
    "stdout": "[完整原始輸出]",
    "available": true
  }
}
```

---

**優先實作**: SQLMap 解析器（最常用且問題最嚴重）

