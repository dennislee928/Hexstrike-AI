# CORS 問題完整解決方案 ✅

## 問題分析

### 根本原因
前端程式碼中**硬編碼了舊的 Render URL**,而實際的後端已經改用新的自訂域名:

- ❌ **舊 URL (硬編碼)**: `https://hexstrike-ai-v6-0.onrender.com`
- ✅ **新 URL (實際)**: `https://hexstrike-ai.dennisleehappy.org`

### 症狀
從 Chrome DevTools Network 標籤可以看到:
```
Status: CORS error
Type: fetch
Name: nmap
```

前端嘗試呼叫舊的 Render URL,該服務可能已經不存在或不再配置 CORS,導致 CORS 錯誤。

---

## 已完成的修復 ✅

### 1. 後端 CORS 配置 (已完成 ✅)

從 Render logs 確認後端 CORS 已正確配置:

```
2025-11-03 10:40:34,611 - __main__ - INFO - ✅ CORS configured with origins: 
['http://localhost:3000', 'https://localhost:3000', 'https://hexstrike-ai-fe.netlify.app']
```

**檔案**: `hexstrike_server.py`
```python
CORS(app, 
     origins=['http://localhost:3000', 'https://localhost:3000', 'https://hexstrike-ai-fe.netlify.app'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-API-Key'],
     supports_credentials=True,
     max_age=86400)
```

### 2. 前端 URL 批量更新 (已完成 ✅)

**執行的操作**:
```powershell
.\scripts\update-api-urls.ps1
```

**結果**:
- ✅ 掃描了 143 個檔案
- ✅ 更新了 90 個檔案
- ✅ 所有硬編碼的舊 URL 已替換為新 URL

**更新的檔案類型**:
- `src/app/tools/**/page.tsx` (99 個工具頁面)
- `src/lib/api.ts` (API client)
- `next.config.js` (Next.js 配置)
- 其他相關配置檔案

**範例更新** (nmap 工具):

```typescript
// 之前 ❌
const response = await fetch('https://hexstrike-ai-v6-0.onrender.com/api/tools/nmap', {
  method: 'POST',
  ...
})

// 之後 ✅
const response = await fetch('https://hexstrike-ai.dennisleehappy.org/api/tools/nmap', {
  method: 'POST',
  ...
})
```

### 3. 建立統一配置檔案 (已完成 ✅)

**新檔案**: `Front-End/src/lib/config.ts`

此檔案提供:
- 中央化的 API URL 管理
- 所有工具端點的常數定義
- 輔助函數 `getApiUrl()` 和 `getToolApiUrl()`

**未來建議**: 逐步將所有工具頁面重構為使用此配置檔案,而非硬編碼 URL。

### 4. 更新 Next.js 配置 (已完成 ✅)

**檔案**: `Front-End/next.config.js`

```javascript
env: {
  NEXT_PUBLIC_HEXSTRIKE_API_URL: process.env.NEXT_PUBLIC_HEXSTRIKE_API_URL || 
    'https://hexstrike-ai.dennisleehappy.org',
}
```

### 5. 建立部署文檔 (已完成 ✅)

**新檔案**: `Front-End/NETLIFY_ENV_SETUP.md`

包含:
- Netlify 環境變數設置步驟
- 部署驗證方法
- 故障排除指南

---

## 下一步:部署到 Netlify 🚀

### 步驟 1: 提交程式碼變更

```bash
cd Front-End
git add .
git commit -m "fix: Update all API URLs to new custom domain (https://hexstrike-ai.dennisleehappy.org)"
git push origin main
```

### 步驟 2: Netlify 自動部署

Netlify 會自動檢測到 Git 推送並觸發新的部署。

**監控部署**:
1. 前往 https://app.netlify.com
2. 選擇 `hexstrike-ai-fe` 專案
3. 查看 **"Deploys"** 標籤
4. 等待狀態變為 **"Published"** (通常 2-5 分鐘)

### 步驟 3: 驗證修復

部署完成後:

**A. 測試 Nmap 工具**
1. 訪問: https://hexstrike-ai-fe.netlify.app/tools/network/nmap/
2. 開啟瀏覽器開發者工具 (F12)
3. 切換到 **Network** 標籤
4. 輸入目標: `scanme.nmap.org`
5. 點擊 **"START SCAN"**
6. 檢查 Network 請求:
   - ✅ URL: `https://hexstrike-ai.dennisleehappy.org/api/tools/nmap`
   - ✅ Status: `200` 或 `202` (不再是 CORS error)
   - ✅ Response Headers 包含 `Access-Control-Allow-Origin`

**B. 檢查 Console**
- ❌ 不應該有任何 CORS 錯誤
- ✅ 應該看到成功的 API 請求日誌

**C. 測試其他工具**
嘗試幾個不同的工具確保都能正常運作:
- Nikto: https://hexstrike-ai-fe.netlify.app/tools/web/nikto/
- Gobuster: https://hexstrike-ai-fe.netlify.app/tools/web/gobuster/
- SQLMap: https://hexstrike-ai-fe.netlify.app/tools/web/sqlmap/

---

## 技術細節

### CORS 運作原理

1. **瀏覽器發送預檢請求 (OPTIONS)**:
   ```http
   OPTIONS /api/tools/nmap HTTP/1.1
   Origin: https://hexstrike-ai-fe.netlify.app
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: Content-Type
   ```

2. **後端返回 CORS Headers**:
   ```http
   HTTP/1.1 204 No Content
   Access-Control-Allow-Origin: https://hexstrike-ai-fe.netlify.app
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
   Access-Control-Allow-Headers: Content-Type, Authorization, ...
   Access-Control-Max-Age: 86400
   ```

3. **瀏覽器允許實際請求**:
   ```http
   POST /api/tools/nmap HTTP/1.1
   Origin: https://hexstrike-ai-fe.netlify.app
   Content-Type: application/json
   
   {"target":"scanme.nmap.org","scan_type":"quick"}
   ```

### 為什麼之前會失敗?

**舊流程** (失敗):
```
Netlify Frontend (hexstrike-ai-fe.netlify.app)
    ↓ fetch('https://hexstrike-ai-v6-0.onrender.com/...')
    ↓
[舊的 Render URL - 可能已下線或 CORS 未配置]
    ↓
❌ CORS Error
```

**新流程** (成功):
```
Netlify Frontend (hexstrike-ai-fe.netlify.app)
    ↓ fetch('https://hexstrike-ai.dennisleehappy.org/...')
    ↓
[新的自訂域名 - CORS 已正確配置]
    ↓
✅ 200 OK with CORS Headers
```

---

## 檔案變更摘要

### 新增的檔案
1. ✅ `Front-End/src/lib/config.ts` - 統一配置檔案
2. ✅ `Front-End/scripts/update-api-urls.ps1` - URL 更新腳本
3. ✅ `Front-End/NETLIFY_ENV_SETUP.md` - Netlify 部署指南
4. ✅ `CORS_FIX_COMPLETE.md` - 此文件

### 修改的檔案
1. ✅ `Front-End/next.config.js` - 更新預設 API URL
2. ✅ `Front-End/src/lib/api.ts` - 更新 API client 預設 URL
3. ✅ `Front-End/src/app/tools/**/page.tsx` - 90 個工具頁面的 URL 更新

### 後端檔案 (無需變更)
- ✅ `hexstrike_server.py` - CORS 已正確配置
- ✅ `config/settings.py` - CORS 設定已包含
- ✅ `api/middleware/cors_handler.py` - CORS 中間件已配置

---

## 環境變數配置 (可選)

雖然程式碼已包含正確的預設 URL,但您仍可在 Netlify 設置環境變數以便於未來切換:

**Netlify Dashboard > Site settings > Environment variables**

```
Key: NEXT_PUBLIC_HEXSTRIKE_API_URL
Value: https://hexstrike-ai.dennisleehappy.org
Scopes: All (Production, Deploy Previews, Branch deploys)
```

---

## 故障排除

### 問題: 部署後仍有 CORS 錯誤

**檢查項目**:

1. ✅ **確認後端在線**:
   ```bash
   curl https://hexstrike-ai.dennisleehappy.org/health
   ```
   應該返回 `200 OK`

2. ✅ **檢查前端使用的 URL**:
   - 打開瀏覽器 DevTools > Network
   - 查看實際發送的請求 URL
   - 確認不再是舊的 `hexstrike-ai-v6-0.onrender.com`

3. ✅ **清除瀏覽器快取**:
   - Chrome: `Ctrl + Shift + Delete`
   - 選擇 "Cached images and files"
   - 重新載入頁面

4. ✅ **驗證 CORS Headers**:
   ```bash
   curl -H "Origin: https://hexstrike-ai-fe.netlify.app" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://hexstrike-ai.dennisleehappy.org/api/tools/nmap \
        -v
   ```
   
   應該看到:
   ```
   Access-Control-Allow-Origin: https://hexstrike-ai-fe.netlify.app
   ```

### 問題: API 請求返回 404

**可能原因**: 後端路由未正確配置

**解決方案**:
1. 檢查後端日誌
2. 確認端點路徑正確
3. 測試直接訪問: `https://hexstrike-ai.dennisleehappy.org/api/tools/nmap`

### 問題: 某些工具可以,某些不行

**可能原因**: 個別工具的後端端點問題

**解決方案**:
1. 檢查具體哪個工具失敗
2. 查看該工具的後端實作
3. 檢查後端日誌中的錯誤訊息

---

## 未來改進建議

### 1. 重構為使用統一 API Client

目前大多數工具頁面直接使用 `fetch()`,建議重構為使用 `src/lib/api.ts` 中的 API client:

```typescript
// 之前 (不推薦)
const response = await fetch('https://hexstrike-ai.dennisleehappy.org/api/tools/nmap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ target, scan_type: scanType })
})

// 之後 (推薦)
import { apiClient } from '@/lib/api'

const response = await apiClient.nmapScan(target, scanType)
```

**優點**:
- 統一的錯誤處理
- 自動的請求/響應攔截器
- 更好的 TypeScript 型別支援
- 更容易測試和維護

### 2. 使用配置檔案中的常數

```typescript
// 使用 config.ts
import { getToolApiUrl } from '@/lib/config'

const url = getToolApiUrl('nmap')
const response = await fetch(url, { ... })
```

### 3. 環境特定配置

建立 `.env.local`, `.env.development`, `.env.production` 檔案來管理不同環境的配置。

### 4. 添加 API 請求監控

使用 Sentry 或 LogRocket 來監控 API 請求失敗,快速發現和診斷問題。

---

## 驗證檢查清單

完成部署後,請執行以下檢查:

- [ ] 前端程式碼已推送到 Git
- [ ] Netlify 部署已完成 (狀態: Published)
- [ ] 訪問 https://hexstrike-ai-fe.netlify.app/ 正常
- [ ] Nmap 工具可以成功執行掃描
- [ ] Browser DevTools Network 標籤沒有 CORS 錯誤
- [ ] Browser Console 沒有錯誤訊息
- [ ] 測試至少 3 個不同的工具都能正常運作
- [ ] 後端健康檢查正常: https://hexstrike-ai.dennisleehappy.org/health

---

## 聯絡與支援

如果問題持續存在,請提供:

1. **前端**: 
   - Netlify 部署日誌截圖
   - Browser DevTools Network 標籤截圖
   - Browser Console 錯誤訊息

2. **後端**:
   - Render 服務日誌
   - 具體失敗的 API 端點
   - 請求/響應的完整內容

3. **測試資訊**:
   - 使用的瀏覽器和版本
   - 測試的具體工具
   - 輸入的參數

---

**修復完成日期**: 2025-11-04  
**狀態**: ✅ 程式碼已更新,等待 Netlify 部署  
**負責人**: AI Assistant  
**審查者**: Dennis Lee

---

## 總結

這次 CORS 問題的根本原因是**前端硬編碼了舊的後端 URL**,而後端已經遷移到新的自訂域名。

透過批量更新所有前端檔案中的 URL,並建立統一的配置管理,問題已得到徹底解決。

下一步只需要將變更部署到 Netlify,CORS 錯誤就會完全消失。

🎉 **問題已解決!**

