# Render CORS 配置指南

## 問題
前端部署在 Netlify (https://hexstrike-ai-fe.netlify.app/) 時遇到 CORS 錯誤，無法訪問後端 API。

## 解決方案

### 1. 代碼已更新

已在以下文件中添加 CORS 支持：

#### `hexstrike_server.py` (主入口點)
```python
# Configure CORS for frontend access
from flask_cors import CORS

cors_origins = os.environ.get('CORS_ORIGINS', 
    'http://localhost:3000,https://localhost:3000,https://hexstrike-ai-fe.netlify.app').split(',')

CORS(app, 
     origins=[origin.strip() for origin in cors_origins],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-API-Key'],
     expose_headers=['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining', 'X-API-Version'],
     supports_credentials=True,
     max_age=86400)
```

#### `config/settings.py`
添加了 CORS 配置選項。

#### `api/middleware/cors_handler.py`
更新了 CORS 處理器以支持 Netlify URL。

### 2. Render 環境變數配置

在 Render Dashboard 中設置以下環境變數：

#### 選項 A：使用預設值（推薦）
不需要設置任何環境變數，代碼會自動使用以下預設值：
- `http://localhost:3000`
- `https://localhost:3000`
- `https://hexstrike-ai-fe.netlify.app`

#### 選項 B：自定義 CORS 來源
如果需要添加更多來源，在 Render Dashboard 中設置：

**變數名**: `CORS_ORIGINS`

**值**: 
```
http://localhost:3000,https://localhost:3000,https://hexstrike-ai-fe.netlify.app
```

或添加其他域名：
```
http://localhost:3000,https://localhost:3000,https://hexstrike-ai-fe.netlify.app,https://yourdomain.com
```

### 3. 在 Render 上設置環境變數的步驟

1. 登入 Render Dashboard
2. 選擇您的 HexStrike AI 服務
3. 點擊左側的 **"Environment"** 標籤
4. 點擊 **"Add Environment Variable"**
5. 輸入：
   - **Key**: `CORS_ORIGINS`
   - **Value**: `http://localhost:3000,https://localhost:3000,https://hexstrike-ai-fe.netlify.app`
6. 點擊 **"Save Changes"**
7. Render 會自動重新部署服務

### 4. 驗證 CORS 配置

部署完成後，您可以通過以下方式驗證：

#### 方法 1：檢查服務器日誌
在 Render Dashboard 的 "Logs" 標籤中，您應該看到：
```
✅ CORS configured with origins: ['http://localhost:3000', 'https://localhost:3000', 'https://hexstrike-ai-fe.netlify.app']
```

#### 方法 2：測試 API 請求
使用瀏覽器開發者工具（F12）訪問 https://hexstrike-ai-fe.netlify.app/，然後檢查 Network 標籤：

1. 查找任何 API 請求
2. 檢查 Response Headers 是否包含：
   ```
   Access-Control-Allow-Origin: https://hexstrike-ai-fe.netlify.app
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
   Access-Control-Allow-Credentials: true
   ```

#### 方法 3：使用 curl 測試
```bash
curl -H "Origin: https://hexstrike-ai-fe.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://hexstrike-ai-v6-0.onrender.com/health \
     -v
```

您應該在響應中看到 CORS 標頭。

### 5. 前端配置確認

確保前端的 API URL 配置正確：

在 Netlify Dashboard 的環境變數中設置：
```
NEXT_PUBLIC_HEXSTRIKE_API_URL=https://hexstrike-ai-v6-0.onrender.com
```

### 6. 常見問題排查

#### 問題：仍然看到 CORS 錯誤
**解決方案**:
1. 確認 Render 服務已重新部署
2. 清除瀏覽器緩存
3. 檢查 Render 日誌中的 CORS 配置
4. 確認 Flask-CORS 已安裝（在 requirements.txt 中）

#### 問題：OPTIONS 請求失敗
**解決方案**:
- CORS 配置中已包含 OPTIONS 方法
- 確保沒有中間件阻止 OPTIONS 請求

#### 問題：憑證（cookies）無法發送
**解決方案**:
- `supports_credentials=True` 已啟用
- 前端請求需要設置 `credentials: 'include'`

### 7. 安全注意事項

⚠️ **生產環境建議**：

1. **限制來源**：不要使用 `origins: ['*']`，始終明確列出允許的域名
2. **定期審查**：定期檢查允許的來源列表
3. **HTTPS 優先**：在生產環境中只允許 HTTPS 來源
4. **監控**：啟用日誌記錄以監控 CORS 請求

### 8. 多環境配置示例

如果您有多個環境（開發、測試、生產），可以這樣配置：

**開發環境**:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**測試環境**:
```
CORS_ORIGINS=https://staging-hexstrike.netlify.app,http://localhost:3000
```

**生產環境**:
```
CORS_ORIGINS=https://hexstrike-ai-fe.netlify.app
```

## 部署清單

- [x] 更新 `hexstrike_server.py` 添加 CORS 配置
- [x] 更新 `config/settings.py` 添加 CORS 設置
- [x] 更新 `api/middleware/cors_handler.py`
- [x] 更新 `core/app.py` 初始化 CORS
- [ ] 在 Render Dashboard 設置環境變數（可選）
- [ ] 重新部署後端服務
- [ ] 在前端測試 API 連接
- [ ] 驗證 CORS 標頭

## 相關文檔

- [Flask-CORS 文檔](https://flask-cors.readthedocs.io/)
- [MDN CORS 指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Render 環境變數](https://render.com/docs/environment-variables)

## 聯絡支援

如果問題持續存在，請提供：
1. Render 服務日誌截圖
2. 瀏覽器 Console 錯誤信息
3. Network 標籤中的請求/響應詳情

---

**最後更新**: 2025-11-03
**狀態**: ✅ 已配置並準備部署

