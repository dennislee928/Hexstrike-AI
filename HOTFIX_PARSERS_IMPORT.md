# 🔧 Hotfix: 解析器導入問題修復

## 問題診斷

### 錯誤訊息
```
parse_error: "No module named 'sqlmap_parser'"
```

### 根本原因
1. Docker 容器中的 Python 模組路徑配置問題
2. `sys.path.insert(0, '/app/tools/parsers')` 可能不正確
3. 解析器文件可能沒有正確複製到容器中

---

## 🔧 解決方案

### 選項 1: 修復導入路徑（推薦）

在 `hexstrike_server.py` 中，解析器導入應該這樣修改：

```python
# 當前（有問題）
import sys
sys.path.insert(0, '/app/tools/parsers')
from sqlmap_parser import parse_sqlmap_output

# 修復後
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'tools', 'parsers'))
from sqlmap_parser import parse_sqlmap_output
```

或者使用相對導入：

```python
# 更好的方式
try:
    from tools.parsers.sqlmap_parser import parse_sqlmap_output
except ImportError as e:
    logger.error(f"Failed to import parser: {e}")
    # 返回原始結果
```

### 選項 2: 更新 Dockerfile

確保 `tools/parsers/` 目錄被正確複製到容器：

```dockerfile
# 在 Dockerfile 中確認
COPY tools/ /app/tools/
```

### 選項 3: 添加 __init__.py 到父目錄

確保 Python 能夠識別 `tools` 作為包：

```bash
# 確認文件結構
tools/
├── __init__.py          # 需要這個
└── parsers/
    ├── __init__.py      # 已有
    ├── base_parser.py
    ├── sqlmap_parser.py
    └── ...
```

---

## 🚀 快速修復步驟

### 步驟 1: 檢查文件是否存在

```bash
# 在 Render shell 或本地檢查
ls -la tools/parsers/
```

### 步驟 2: 創建 tools/__init__.py

```bash
# 確保 tools 是 Python 包
touch tools/__init__.py
```

### 步驟 3: 修改導入方式

在所有 4 個工具端點中，將導入改為：

```python
@app.route("/api/tools/sqlmap", methods=["POST"])
def sqlmap():
    try:
        # ... 前面的代碼 ...
        
        if parse_output and result.get("success"):
            try:
                # 修復後的導入
                from tools.parsers.sqlmap_parser import parse_sqlmap_output
                
                parsed = parse_sqlmap_output(
                    result.get("stdout", ""),
                    result.get("stderr", ""),
                    result.get("return_code", 0)
                )
                
                # ... 後續代碼 ...
```

---

## 📝 批次模式參數修復

SQLMap 仍然有互動提示，需要更完整的參數：

### 當前問題
```
"do you want to test this URL? [Y/n/q]"
"Do you want to skip test payloads..."
```

### 完整的批次模式參數

```python
command = f"sqlmap -u {url}"

# 核心批次參數
command += " --batch"                          # 永不詢問用戶輸入
command += " --flush-session"                  # 清除會話
command += " --fresh-queries"                  # 忽略之前的查詢

# 更完整的自動回答
command += " --forms"                          # 自動測試表單
command += " --crawl=0"                        # 禁用爬蟲
command += " --threads=1"                      # 單線程（避免競爭）

# 額外的非互動參數
command += " --skip-urlencode"                 # 跳過 URL 編碼提示
command += " --no-cast"                        # 不詢問類型轉換
command += " --keep-alive"                     # 保持連接

# 測試參數
command += f" --level={level}"
command += f" --risk={risk}"
```

---

## 🧪 測試修復

### 1. 本地測試導入

```python
# 在 Python REPL 中
import sys
sys.path.insert(0, '/app/tools/parsers')

try:
    from sqlmap_parser import parse_sqlmap_output
    print("Import successful!")
except ImportError as e:
    print(f"Import failed: {e}")
```

### 2. 測試修復後的端點

```bash
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/tools/sqlmap \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://testphp.vulnweb.com/artists.php?artist=1",
    "level": "1",
    "risk": "1"
  }' | jq '.summary'
```

預期結果：
- 無 `parse_error`
- 有 `summary` 欄位
- 有 `findings` 欄位
- 無互動提示在 stdout 中

---

## 📊 優先級

1. **緊急**: 修復導入路徑（影響所有 4 個工具）
2. **高**: 完善批次模式參數（改善用戶體驗）
3. **中**: 添加更好的錯誤處理

---

## 🔄 實施計劃

### 立即修復（今天）
1. 創建 `tools/__init__.py`
2. 修改所有 4 個端點的導入方式
3. 提交並推送
4. 等待自動部署
5. 重新測試

### 後續改進（明天）
1. 完善批次模式參數
2. 添加更詳細的日誌
3. 改進錯誤處理

---

**狀態**: 問題已診斷  
**下一步**: 實施修復

