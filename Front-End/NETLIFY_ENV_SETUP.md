# Netlify 環境變數設置指南

## 問題已解決 ✅

前端已成功更新所有 API URLs,現在指向正確的後端伺服器。

## 當前配置

- **後端 URL**: `https://hexstrike-ai.dennisleehappy.org`
- **前端 URL**: `https://hexstrike-ai-fe.netlify.app`
- **更新的檔案數**: 90 個工具頁面 + API client

## Netlify 環境變數 (可選)

雖然程式碼已經包含正確的預設 URL,但如果您需要覆蓋或在不同環境使用不同的後端,可以設置環境變數:

### 步驟

1. 登入 Netlify Dashboard: https://app.netlify.com
2. 選擇 `hexstrike-ai-fe` 專案
3. 點擊 **"Site settings"**
4. 在左側選單選擇 **"Environment variables"**
5. 點擊 **"Add a variable"** 或 **"Add environment variable"**
6. 輸入:
   - **Key**: `NEXT_PUBLIC_HEXSTRIKE_API_URL`
   - **Value**: `https://hexstrike-ai.dennisleehappy.org`
   - **Scopes**: 全選 (Production, Deploy Previews, Branch deploys)
7. 點擊 **"Create variable"** 或 **"Save"**
8. 觸發重新部署

### 觸發重新部署

設置環境變數後,需要觸發重新部署:

**選項 A: 在 Netlify Dashboard**
1. 到 **"Deploys"** 標籤
2. 點擊右上角的 **"Trigger deploy"**
3. 選擇 **"Deploy site"**

**選項 B: 透過 Git**
```bash
# 在前端專案目錄
git commit --allow-empty -m "Trigger Netlify rebuild for env vars"
git push origin main
```

## 驗證部署

部署完成後,驗證 CORS 問題已解決:

### 1. 檢查 Network 請求

1. 打開 https://hexstrike-ai-fe.netlify.app/tools/network/nmap/
2. 開啟瀏覽器開發者工具 (F12)
3. 切換到 **Network** 標籤
4. 執行一次 Nmap 掃描
5. 查看 API 請求:
   - URL 應該是: `https://hexstrike-ai.dennisleehappy.org/api/tools/nmap`
   - Status 應該是: `200` (不再是 CORS error)
   - Response Headers 應包含:
     ```
     Access-Control-Allow-Origin: https://hexstrike-ai-fe.netlify.app
     Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
     ```

### 2. 檢查 Console 錯誤

在瀏覽器 Console 標籤中不應該看到任何 CORS 相關的錯誤訊息。

### 3. 測試功能

嘗試使用以下工具確保都能正常工作:
- ✅ Nmap 掃描
- ✅ Nikto 掃描
- ✅ Gobuster 目錄爆破
- ✅ 其他任何工具

## 環境變數清單

### 必需的環境變數

目前**不需要**設置任何環境變數,因為程式碼已包含正確的預設值。

### 可選的環境變數

| 變數名稱 | 說明 | 預設值 | 範例 |
|---------|------|--------|------|
| `NEXT_PUBLIC_HEXSTRIKE_API_URL` | 後端 API 基礎 URL | `https://hexstrike-ai.dennisleehappy.org` | `https://api.example.com` |

## 多環境配置

如果您有多個環境 (開發、測試、生產):

### 生產環境 (Production)
```
NEXT_PUBLIC_HEXSTRIKE_API_URL=https://hexstrike-ai.dennisleehappy.org
```

### 測試環境 (Staging)
```
NEXT_PUBLIC_HEXSTRIKE_API_URL=https://staging-hexstrike-ai.onrender.com
```

### 本地開發 (Local)
在 `Front-End/.env.local` 檔案:
```env
NEXT_PUBLIC_HEXSTRIKE_API_URL=http://localhost:8888
```

## 故障排除

### 問題 1: 仍然看到 CORS 錯誤

**解決方案**:
1. 清除瀏覽器快取 (Ctrl + Shift + Del)
2. 在 Netlify 觸發新的部署
3. 檢查後端 CORS 配置是否包含 Netlify URL
4. 確認後端伺服器正在運行

### 問題 2: API 請求超時

**解決方案**:
1. 確認後端 URL 正確
2. 檢查後端伺服器狀態: https://hexstrike-ai.dennisleehappy.org/health
3. 增加請求超時時間 (在 `src/lib/api.ts` 中)

### 問題 3: 環境變數未生效

**解決方案**:
1. 確認變數名稱以 `NEXT_PUBLIC_` 開頭
2. 確認已觸發重新部署
3. 檢查 Netlify 部署日誌

## 後端 CORS 配置驗證

後端應該已經配置好 CORS,可以透過以下方式驗證:

```bash
# 測試 CORS 預檢請求
curl -H "Origin: https://hexstrike-ai-fe.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://hexstrike-ai.dennisleehappy.org/api/tools/nmap \
     -v
```

期望的響應 Headers:
```
Access-Control-Allow-Origin: https://hexstrike-ai-fe.netlify.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-API-Key
Access-Control-Allow-Credentials: true
```

## 完成檢查清單

- [x] ✅ 更新前端程式碼中的 API URLs (90 個檔案)
- [x] ✅ 更新 `next.config.js` 預設值
- [x] ✅ 更新 `src/lib/api.ts` 預設值
- [x] ✅ 建立統一的配置檔案 `src/lib/config.ts`
- [ ] 🔄 (可選) 在 Netlify 設置環境變數
- [ ] 🔄 在 Netlify 觸發重新部署
- [ ] 🔄 測試前端與後端連接
- [ ] 🔄 驗證 CORS 已解決

## 相關文件

- [Netlify 環境變數文檔](https://docs.netlify.com/environment-variables/overview/)
- [Next.js 環境變數](https://nextjs.org/docs/basic-features/environment-variables)
- [CORS 說明](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**最後更新**: 2025-11-04  
**狀態**: ✅ 程式碼已更新,等待部署

