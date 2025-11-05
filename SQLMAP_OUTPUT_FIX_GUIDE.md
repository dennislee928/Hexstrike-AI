# 🎯 SQLMap 輸出優化實施指南

## ✅ 已完成的修復

### 1. 批次模式（消除互動提示）
```bash
# 修復前：需要手動輸入 Y/n
do you want to test this URL? [Y/n/q]
Do you want to use those [Y/n] Y
how do you want to proceed? [(C)ontinue/(s)tring/(r)egex/(q)uit] C

# 修復後：完全自動化
--batch
--flush-session
--fresh-queries
--answers='quit=N,follow=Y,continue=Y'
```

### 2. 智能輸出解析器
- 自動提取注入點
- 識別資料庫類型
- 檢測 WAF/IPS
- 生成建議
- 結構化摘要

### 3. 標準化 JSON 響應
前端友善的結構化格式

---

## 🚀 使用方式

### API 請求範例

```javascript
// 基本使用（自動解析）
fetch('https://hexstrike-ai.dennisleehappy.org/api/tools/sqlmap', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    url: 'https://example.com/page?id=1',
    level: '3',  // 測試深度 1-5
    risk: '2',   // 風險等級 1-3
    method: 'GET'
  })
})
.then(res => res.json())
.then(data => {
  // 標準化響應格式
  console.log('摘要:', data.summary);
  console.log('漏洞:', data.findings);
  console.log('建議:', data.metadata.recommendations);
});
```

### 標準化響應格式

```json
{
  "success": true,
  "tool": "sqlmap",
  "target": "https://example.com/page?id=1",
  "timestamp": "2025-11-04T10:11:03",
  "execution_time": 26.28,
  
  "summary": {
    "status": "vulnerable" | "clean" | "partial",
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "brief": "發現 2 個 SQL 注入漏洞（資料庫：MySQL 5.7）",
    "findings_count": 2
  },
  
  "findings": [
    {
      "type": "sql_injection",
      "severity": "critical",
      "parameter": "id",
      "injection_type": "boolean-based blind",
      "title": "AND boolean-based blind - WHERE or HAVING clause",
      "payload": "1 AND 1=1",
      "description": "參數 'id' 存在 boolean-based blind SQL 注入漏洞",
      "recommendation": "立即修復：使用參數化查詢或 ORM，永不直接拼接 SQL"
    }
  ],
  
  "details": {
    "vulnerable": true,
    "dbms": "MySQL 5.7.38",
    "injection_points": [...],
    "injection_types": ["boolean-based blind", "time-based blind"],
    "waf_detected": false,
    "techniques_used": ["布林盲注", "時間盲注"]
  },
  
  "metadata": {
    "parameters_used": {
      "level": "3",
      "risk": "2",
      "method": "GET"
    },
    "warnings": [
      "target URL content is not stable"
    ],
    "recommendations": [
      "檢測到可能的 WAF 保護，建議使用 --tamper 參數繞過",
      "嘗試這些 tamper 腳本：space2comment, charencode, randomcase"
    ]
  },
  
  "raw_output": {
    "stdout": "[完整原始輸出...]",
    "stderr": "",
    "return_code": 0,
    "available": true
  }
}
```

---

## 🎨 前端顯示範例

### React 組件範例

```tsx
function SQLMapResult({ data }) {
  const { summary, findings, metadata } = data;
  
  return (
    <div className="sqlmap-result">
      {/* 狀態摘要 */}
      <StatusCard 
        status={summary.status}
        severity={summary.severity}
        message={summary.brief}
      />
      
      {/* 漏洞列表 */}
      {findings.length > 0 && (
        <div className="findings">
          <h3>發現的漏洞 ({findings.length})</h3>
          {findings.map((finding, idx) => (
            <VulnerabilityCard key={idx} finding={finding} />
          ))}
        </div>
      )}
      
      {/* 建議 */}
      {metadata.recommendations.length > 0 && (
        <div className="recommendations">
          <h3>建議</h3>
          <ul>
            {metadata.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 警告 */}
      {metadata.warnings.length > 0 && (
        <Alert type="warning">
          {metadata.warnings.join('; ')}
        </Alert>
      )}
      
      {/* 原始輸出（可選，摺疊顯示）*/}
      <CollapsibleSection title="查看原始輸出">
        <pre>{data.raw_output.stdout}</pre>
      </CollapsibleSection>
    </div>
  );
}
```

---

## 📊 狀態說明

| Status | 說明 | 前端顏色 |
|--------|------|---------|
| `vulnerable` | 發現漏洞 | 🔴 紅色 |
| `clean` | 未發現漏洞 | 🟢 綠色 |
| `partial` | 測試受限，結果不確定 | 🟡 黃色 |
| `error` | 測試失敗 | ⚪ 灰色 |

| Severity | 說明 | 處理優先級 |
|----------|------|----------|
| `critical` | 嚴重漏洞，可直接利用 | P0 立即修復 |
| `high` | 高危漏洞 | P1 24h 內修復 |
| `medium` | 中等漏洞 | P2 1 週內修復 |
| `low` | 低危漏洞 | P3 1 個月內修復 |
| `info` | 資訊性結果 | 參考 |

---

## 🧪 測試

### 測試腳本

```bash
# 測試 1：基本掃描
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/sqlmap \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://testphp.vulnweb.com/artists.php?artist=1",
    "level": "1",
    "risk": "1"
  }' | jq '.summary'

# 測試 2：深度掃描
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/sqlmap \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/search",
    "level": "3",
    "risk": "2",
    "method": "POST",
    "data": "q=test&submit=1"
  }' | jq '.findings'

# 測試 3：不解析（返回原始輸出）
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/sqlmap \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "parse_output": false
  }'
```

---

## 🔄 部署步驟

### 1. 提交代碼

```bash
git add tools/parsers/sqlmap_parser.py
git add tools/parsers/__init__.py
git add hexstrike_server.py
git add SQLMAP_OUTPUT_FIX_GUIDE.md
git add TOOL_OUTPUT_STANDARDIZATION.md

git commit -m "feat: SQLMap 輸出標準化與智能解析

- 添加批次模式參數消除互動提示
- 創建 SQLMapParser 智能解析器
- 標準化 JSON 響應格式
- 前端友善的摘要和建議
- 保留原始輸出供進階用戶查看"

git push origin main
```

### 2. 驗證部署

```bash
# 1. 檢查健康狀態
curl https://hexstrike-ai.dennisleehappy.org/health

# 2. 測試 SQLMap（應該無互動提示）
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/sqlmap \
  -H "Content-Type: application/json" \
  -d '{"url": "http://testphp.vulnweb.com/artists.php?artist=1"}'

# 3. 驗證響應格式
# 應該包含：summary, findings, details, metadata
```

---

## 📝 前端更新清單

### 需要更新的組件

1. **SQLMap 掃描頁面** (`Front-End/src/app/tools/web/sqlmap/page.tsx`)
   - 更新請求參數（添加 level, risk, method）
   - 更新響應處理（使用新的標準化格式）
   - 添加摘要卡片顯示
   - 添加漏洞列表
   - 添加建議區塊

2. **結果顯示組件** （新建或更新）
   - StatusCard（狀態摘要）
   - VulnerabilityCard（漏洞詳情）
   - RecommendationsList（建議清單）
   - RawOutputCollapsible（原始輸出）

3. **型別定義** (`Front-End/src/types/sqlmap.ts` - 新建)
   ```typescript
   interface SQLMapResponse {
     success: boolean;
     tool: string;
     target: string;
     timestamp: string;
     execution_time: number;
     summary: {
       status: 'vulnerable' | 'clean' | 'partial' | 'error';
       severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
       brief: string;
       findings_count: number;
     };
     findings: Finding[];
     details: Details;
     metadata: Metadata;
     raw_output?: RawOutput;
   }
   ```

---

## 🎯 下一步

### 優先順序 1（本週）
- [x] SQLMap 批次模式
- [x] SQLMap 輸出解析器
- [ ] 前端 SQLMap 頁面更新
- [ ] 測試驗證

### 優先順序 2（下週）
- [ ] Hydra 輸出解析
- [ ] Nikto 輸出解析
- [ ] WPScan JSON 模式
- [ ] Nuclei 輸出標準化

### 優先順序 3（未來）
- [ ] 所有工具統一響應格式
- [ ] 建立解析器測試套件
- [ ] 性能優化（快取解析結果）

---

## 🐛 故障排除

### 問題 1：解析器導入失敗

**症狀**：`ModuleNotFoundError: No module named 'sqlmap_parser'`

**解決**：
```bash
# 確認文件結構
ls -la /app/tools/parsers/

# 檢查 Python 路徑
python3 -c "import sys; print(sys.path)"

# 手動測試導入
python3 -c "import sys; sys.path.insert(0, '/app/tools/parsers'); from sqlmap_parser import parse_sqlmap_output"
```

### 問題 2：仍然有互動提示

**症狀**：SQLMap 仍然要求輸入

**解決**：
檢查命令是否包含所有批次參數：
```bash
--batch
--flush-session
--fresh-queries
--answers='quit=N,follow=Y,continue=Y'
```

### 問題 3：解析失敗

**症狀**：`parse_error` 在響應中

**解決**：
查看 `raw_output.stdout` 找出新的輸出格式，更新解析器

---

**狀態**: ✅ 已實作，待部署測試  
**預計影響**: 大幅提升 UX，消除所有互動提示  
**測試狀態**: ⏳ 待驗證

