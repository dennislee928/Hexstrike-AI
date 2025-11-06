# 🤖 HexStrike AI - AI/MCP 滲透測試架構深度解析

## 📋 概述

HexStrike AI 是一個**以 AI 為核心**的自動化滲透測試平台，深度整合了 **MCP (Model Context Protocol)** 和多個 **AI Intelligence Agents**，實現了真正的智能化安全測試。

---

## 🎯 核心概念：AI-Driven Penetration Testing

### 什麼是 MCP？

**MCP (Model Context Protocol)** 是一個讓 AI 代理（如 Claude、GPT）可以直接控制工具和服務的協議。

在 HexStrike AI 中：
- **AI 不只是輔助**，而是**主動執行**滲透測試
- **自然語言控制**：用戶用自然語言下達指令 → AI 轉換為工具執行
- **智能決策**：AI 根據掃描結果自動選擇下一步行動

---

## 🏗️ 三層 AI 架構

### 第 1 層：MCP 通訊層
```
用戶自然語言指令
    ↓
AI 代理 (Claude Desktop / GPT)
    ↓ [MCP Protocol]
hexstrike_mcp.py (MCP Server)
    ↓ [HTTP API]
hexstrike_server.py (Flask API)
    ↓ [Subprocess]
安全工具 (Nmap, Nuclei, SQLMap...)
```

**實際應用範例**：
```
用戶對 Claude 說：
"掃描 example.com 並找出所有可能的 SQL 注入點"

Claude 透過 MCP 執行：
1. nmap_scan("example.com")  # 端口掃描
2. httpx_probe("example.com")  # 探測 web 服務
3. katana_crawl("example.com")  # 爬取所有 URL
4. sqlmap_scan(..., auto_params)  # 自動測試 SQL 注入
5. 分析結果並生成報告
```

### 第 2 層：AI 決策引擎 (IntelligentDecisionEngine)

這是核心的 **AI-powered 工具選擇和參數優化引擎**。

#### 核心功能

**1. 目標分析與分類**
```python
class IntelligentDecisionEngine:
    def analyze_target(self, target: str) -> TargetProfile:
        """AI 分析目標並建立 profile"""
        # 自動識別目標類型
        - Web Application
        - API Endpoint
        - Network Host
        - Binary File
        - Cloud Service
        - Mobile App
        
        # 技術棧指紋識別
        - WordPress/Joomla/Drupal
        - PHP/Python/Node.js
        - Apache/Nginx/IIS
        - AWS/Azure/GCP
```

**2. 智能工具選擇**
```python
def select_optimal_tools(self, profile: TargetProfile, objective: str):
    """根據目標特徵選擇最有效的工具"""
    
    # AI 評分系統 (0.0 - 1.0)
    tool_effectiveness = {
        "WEB_APPLICATION": {
            "nuclei": 0.95,     # 漏洞掃描最有效
            "dalfox": 0.93,     # XSS 檢測高分
            "wpscan": 0.95,     # WordPress 專用
            "gobuster": 0.9,    # 目錄爆破
            "sqlmap": 0.9,      # SQL 注入
        },
        "NETWORK_HOST": {
            "nmap": 0.95,       # 端口掃描王者
            "rustscan": 0.9,    # 超快速掃描
            "masscan": 0.88,    # 大規模掃描
        },
        "BINARY_FILE": {
            "ghidra": 0.95,     # 逆向工程
            "radare2": 0.9,     # 二進制分析
            "checksec": 0.85,   # 安全檢查
        }
    }
```

**3. 自動參數優化**
```python
def optimize_parameters(self, tool: str, profile: TargetProfile):
    """AI 根據目標特徵優化工具參數"""
    
    # 範例：Nmap 參數優化
    if tool == "nmap":
        if profile.is_highly_secured:
            # 高安全目標 → 隱蔽掃描
            return {
                "timing": "-T2",      # 慢速掃描
                "scan_type": "-sS",   # SYN 掃描
                "evasion": "--randomize-hosts"
            }
        elif profile.is_time_sensitive:
            # 時間敏感 → 快速掃描
            return {
                "timing": "-T4",
                "scan_type": "-sT",
                "ports": "top-1000"
            }
```

**4. 攻擊鏈建構 (Attack Chain Creation)**
```python
def create_attack_chain(self, profile: TargetProfile, objective: str):
    """AI 建構智能攻擊鏈"""
    
    # Web 應用攻擊鏈範例
    if target_type == "WEB_APPLICATION":
        return [
            # Phase 1: 偵察
            {"tool": "nmap", "priority": 1, "params": {...}},
            {"tool": "httpx", "priority": 1, "params": {...}},
            
            # Phase 2: 資訊收集
            {"tool": "katana", "priority": 2, "params": {...}},
            {"tool": "subfinder", "priority": 2, "params": {...}},
            
            # Phase 3: 漏洞掃描
            {"tool": "nuclei", "priority": 3, "params": {...}},
            {"tool": "dalfox", "priority": 3, "params": {...}},
            
            # Phase 4: 深度測試
            {"tool": "sqlmap", "priority": 4, "params": {...}},
            {"tool": "wpscan", "priority": 4, "params": {...}},
        ]
    
    # CTF 二進制攻擊鏈
    elif objective == "ctf":
        return [
            {"tool": "file", "priority": 1},
            {"tool": "checksec", "priority": 1},
            {"tool": "strings", "priority": 2},
            {"tool": "ghidra", "priority": 3},
            {"tool": "pwntools", "priority": 4}
        ]
```

### 第 3 層：專業 AI Intelligence Managers

**1. CVE Intelligence Manager**
```python
class CVEIntelligenceManager:
    """CVE 漏洞情報管理與利用生成"""
    
    def analyze_cve(self, cve_id: str):
        """分析 CVE 並提取關鍵資訊"""
        # AI 解析 CVE 描述
        # 提取攻擊向量、影響版本、CVSS 分數
    
    def generate_exploit(self, cve_data: dict):
        """AI 自動生成 exploit 代碼"""
        # 根據漏洞類型生成專業 exploit
        # 支援：RCE, SQLi, XSS, Buffer Overflow, etc.
```

**2. AI Exploit Generator**
```python
class AIExploitGenerator:
    """AI 驅動的 exploit 生成器"""
    
    def generate_intelligent_exploit(self, vulnerability_data: dict):
        """根據漏洞資訊生成智能 exploit"""
        
        # 支援的 exploit 類型
        - Buffer Overflow (x86/x64/ARM)
        - Remote Code Execution
        - SQL Injection
        - Cross-Site Scripting
        - Deserialization
        - Authentication Bypass
        - File Read/LFI
        - XXE Injection
        
        # AI 特性
        - 自動 ROP chain 建構
        - Payload 混淆與編碼
        - 繞過 WAF/IDS 技術
        - Multi-stage payloads
```

**3. Vulnerability Correlator**
```python
class VulnerabilityCorrelator:
    """漏洞關聯分析與利用鏈建構"""
    
    def correlate_vulnerabilities(self, findings: list):
        """AI 分析多個漏洞並建構攻擊鏈"""
        
        # 範例：
        # 1. 發現 LFI 漏洞
        # 2. 發現 SSH 服務
        # 3. AI 建議：LFI 讀取 SSH 私鑰 → 登入系統
        
        return {
            "attack_chain": [
                "exploit_lfi_to_read_ssh_key",
                "use_ssh_key_for_login",
                "escalate_privileges"
            ],
            "risk_level": "critical",
            "estimated_impact": "full_system_compromise"
        }
```

---

## 🔧 實際應用場景

### 場景 1：Bug Bounty 自動化

**用戶輸入**（對 Claude 說）：
```
"對 hackerone.com/test-site 進行完整的 bug bounty 測試，
重點關注 OWASP Top 10 漏洞"
```

**AI 自動執行**：
```python
# Phase 1: AI 分析目標
profile = decision_engine.analyze_target("test-site.com")
# 結果：Web Application, PHP, WordPress 5.8, Nginx

# Phase 2: AI 選擇工具
tools = decision_engine.select_optimal_tools(profile, "bug_bounty")
# 選中：nuclei, wpscan, dalfox, sqlmap, ffuf

# Phase 3: AI 建構攻擊鏈
chain = decision_engine.create_attack_chain(profile, "bug_bounty")

# Phase 4: 並行執行
results = execute_parallel(chain)

# Phase 5: AI 關聯分析
vulnerabilities = correlator.correlate_vulnerabilities(results)

# Phase 6: AI 生成報告
report = generate_bug_bounty_report(vulnerabilities)
```

### 場景 2：CTF 自動化解題

**用戶輸入**：
```
"這是一個 ELF 二進制文件，幫我找出漏洞並生成 exploit"
```

**AI 執行流程**：
```python
# 1. 文件分析
file_info = analyze_file("binary")
# 2. 安全檢查
security = checksec("binary")
# 3. 字串提取
strings = extract_strings("binary")
# 4. 反彙編分析
disasm = ghidra_analyze("binary")
# 5. 漏洞識別
vulns = identify_vulnerabilities(disasm)
# 6. Exploit 生成
exploit = generate_buffer_overflow_exploit(vulns[0])
# 7. 自動測試
test_exploit(exploit)
```

### 場景 3：API 安全測試

**用戶輸入**：
```
"測試這個 REST API 的安全性：https://api.example.com"
```

**AI 工作流程**：
```python
# 1. API 發現
endpoints = discover_api_endpoints("https://api.example.com")

# 2. Schema 分析
schema = analyze_api_schema(endpoints)

# 3. 認證測試
auth_vulns = test_authentication_bypasses()

# 4. 參數模糊測試
param_vulns = fuzz_api_parameters()

# 5. 注入測試
injection_vulns = test_injections(["sqli", "nosqli", "xss"])

# 6. 權限測試
authz_vulns = test_authorization_issues()

# 7. 生成專業報告
report = generate_api_security_report()
```

---

## 🎨 MCP Tools 範例

### 100+ MCP Tools 分類

HexStrike 透過 MCP 暴露 **100+ 安全工具**給 AI 代理：

#### 網路偵察 (Network Reconnaissance)
```python
@mcp.tool()
def nmap_scan(target, scan_type, ports, additional_args):
    """AI 可呼叫：Nmap 端口掃描"""
    
@mcp.tool()
def rustscan_scan(target, ulimit, batch_size):
    """AI 可呼叫：超快速端口掃描"""
    
@mcp.tool()
def masscan_scan(target, rate, ports):
    """AI 可呼叫：大規模掃描"""
```

#### Web 應用測試 (Web Application Testing)
```python
@mcp.tool()
def nuclei_scan(target, severity, templates):
    """AI 可呼叫：漏洞掃描（3000+ 模板）"""
    
@mcp.tool()
def dalfox_scan(url, mining_dom, custom_payload):
    """AI 可呼叫：先進 XSS 檢測"""
    
@mcp.tool()
def sqlmap_scan(url, data, level, risk):
    """AI 可呼叫：SQL 注入檢測"""
```

#### AI 增強功能 (AI-Enhanced Features)
```python
@mcp.tool()
def intelligent_smart_scan(target, objective, max_tools):
    """AI 智能掃描：自動選擇工具並執行"""
    # AI 分析 → 選擇 → 執行 → 關聯 → 報告
    
@mcp.tool()
def create_attack_chain(target, objective):
    """建構智能攻擊鏈"""
    
@mcp.tool()
def advanced_payload_generation(attack_type, target_context, evasion_level):
    """AI 生成進階 payload（含 WAF 繞過）"""
```

---

## 🧠 AI 決策範例

### 範例 1：WordPress 網站自動化測試

**AI 思考過程**：
```
1. 檢測到目標：example.com
2. Fingerprint 識別：WordPress 5.8.3
3. 技術棧分析：PHP 7.4, Apache 2.4, Linux
4. 決策：
   ✅ wpscan (0.95 effectiveness for WordPress)
   ✅ nuclei (0.95 general vulnerability scanning)
   ✅ dalfox (0.93 for XSS in plugins)
   ❌ ghidra (0.1 - not relevant for web)
   
5. 參數優化：
   wpscan: --api-token [auto], --enumerate [ap,vp,u]
   nuclei: --severity critical,high --tags wordpress
   
6. 執行順序：
   parallel: [wpscan, nuclei]  # 可並行
   sequential: [dalfox]  # 需要前面結果
```

### 範例 2：雲端安全評估

**AI 決策**：
```
1. 識別：AWS 雲端環境
2. 工具選擇：
   - prowler (0.95 for AWS)
   - trivy (0.9 for container security)
   - kube-hunter (0.88 for K8s)
   
3. 攻擊鏈：
   Phase 1: Cloud posture assessment (prowler)
   Phase 2: Container scanning (trivy)
   Phase 3: K8s security (kube-hunter)
   Phase 4: IAM analysis (custom scripts)
```

---

## 📊 AI 效能指標

### 智能化程度

| 功能 | 傳統工具 | HexStrike AI |
|------|---------|--------------|
| 工具選擇 | 手動 | ✅ AI 自動（based on target profile）|
| 參數調整 | 手動 | ✅ AI 優化（context-aware）|
| 執行順序 | 手動 | ✅ AI 排程（intelligent chaining）|
| 結果關聯 | 手動 | ✅ AI 分析（vulnerability correlation）|
| Exploit 生成 | 手動 | ✅ AI 自動（multi-technique）|
| 繞過技術 | 手動 | ✅ AI 適應（evasion optimization）|

### 自動化程度

- **0% 手動介入**：AI 完全自主決策
- **自然語言控制**：用戶只需描述目標
- **持續學習**：工具效能評分會根據歷史結果調整

---

## 🔐 安全與倫理

### 授權與合規

```python
# 所有 AI 操作都記錄並需要授權
@require_authorization
def execute_security_test(target):
    """所有測試需要明確授權"""
    
    # 記錄所有操作
    log_action(user, target, tools_used, timestamp)
    
    # 僅用於授權測試
    assert user.has_authorization_for(target)
```

### 使用聲明

```
⚠️ HexStrike AI 僅用於授權的安全測試
- Bug Bounty Programs（有授權的漏洞賞金計畫）
- Penetration Testing（滲透測試合約）
- CTF Competitions（CTF 競賽）
- Security Research（安全研究）

❌ 禁止用於未經授權的攻擊或非法活動
```

---

## 🚀 如何使用 AI/MCP 功能

### 方法 1：Claude Desktop 整合

1. **安裝 Claude Desktop**
2. **配置 MCP**：
```json
{
  "mcpServers": {
    "hexstrike": {
      "command": "python",
      "args": ["hexstrike_mcp.py", "--server-url", "http://localhost:8888"]
    }
  }
}
```
3. **重啟 Claude**
4. **開始使用**：
```
用戶："掃描 example.com 並找出所有漏洞"
Claude：[自動執行 nmap → httpx → nuclei → 生成報告]
```

### 方法 2：直接 API 呼叫

```bash
# AI 智能掃描
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/intelligence/smart-scan \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "objective": "bug_bounty",
    "max_tools": 5
  }'

# AI 建構攻擊鏈
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/intelligence/create-attack-chain \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "objective": "comprehensive"
  }'
```

### 方法 3：前端 UI

前端提供 **AI Analysis Dashboard**：
- 自動目標分析
- 智能工具推薦
- 一鍵執行攻擊鏈
- 即時結果可視化

---

## 📚 技術文件

### 相關文件
1. **docs/MCP_INTEGRATION.md** - MCP 整合詳細說明
2. **Documentations/AI_CLIENT_SETUP_GUIDE.md** - AI 客戶端設定
3. **hexstrike_mcp.py** - MCP 伺服器實作（4200+ 行）
4. **core/decision_engine.py** - AI 決策引擎核心

### API 端點
- `/api/intelligence/smart-scan` - AI 智能掃描
- `/api/intelligence/create-attack-chain` - 攻擊鏈建構
- `/api/ai/advanced-payload-generation` - AI payload 生成
- `/api/ai/correlation-analysis` - 漏洞關聯分析

---

## 🎯 總結

### HexStrike AI 的 AI/MCP 滲透測試優勢

✅ **完全自動化**：AI 主導整個滲透測試流程  
✅ **智能決策**：根據目標特徵自動選擇最佳工具  
✅ **自然語言控制**：用戶用人類語言下達指令  
✅ **持續優化**：AI 根據歷史結果調整策略  
✅ **專業級輸出**：自動生成符合行業標準的報告  

### 為什麼這是革命性的？

1. **降低門檻**：新手也能執行專家級測試
2. **提高效率**：AI 並行執行多個工具
3. **減少誤報**：智能關聯分析過濾假陽性
4. **持續演進**：工具效能持續學習優化

---

**HexStrike AI = 150+ 工具 + AI 大腦 + MCP 協議 = 真正的智能滲透測試平台** 🚀

---

**版本**: 6.0.1  
**更新日期**: 2025-11-04  
**狀態**: ✅ Production Ready

