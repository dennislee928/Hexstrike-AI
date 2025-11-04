# 快速部署指令

## 一鍵部署到 Netlify

```bash
# 確保你在 Front-End 目錄
cd Front-End

# 1. 查看變更
git status

# 2. 添加所有變更
git add .

# 3. 提交變更
git commit -m "fix: Update all API URLs to custom domain (dennisleehappy.org)

- Updated 90+ tool pages to use new backend URL
- Fixed CORS issues with Netlify frontend
- Created centralized config file for API URLs
- Added deployment documentation

Resolves: CORS errors when calling backend from Netlify"

# 4. 推送到 GitHub (觸發 Netlify 自動部署)
git push origin main
```

## 驗證部署

```bash
# 等待 2-5 分鐘後,檢查部署狀態
# 訪問: https://app.netlify.com

# 測試後端連接
curl https://hexstrike-ai.dennisleehappy.org/health

# 測試 CORS
curl -H "Origin: https://hexstrike-ai-fe.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://hexstrike-ai.dennisleehappy.org/api/tools/nmap \
     -v
```

## 如果需要手動觸發 Netlify 部署

```bash
# 選項 1: 空提交觸發部署
git commit --allow-empty -m "chore: Trigger Netlify rebuild"
git push origin main

# 選項 2: 使用 Netlify CLI
npm install -g netlify-cli
netlify deploy --prod
```

## 成功指標

部署成功後,你應該看到:

✅ Netlify 部署狀態: "Published"  
✅ 前端頁面正常載入: https://hexstrike-ai-fe.netlify.app  
✅ 後端健康檢查通過: https://hexstrike-ai.dennisleehappy.org/health  
✅ Nmap 工具可以執行掃描,沒有 CORS 錯誤  
✅ Browser DevTools Network 標籤顯示 200 狀態碼  
✅ Browser Console 沒有錯誤訊息  

## 問題排除

如果部署失敗:

```bash
# 檢查 Git 狀態
git status

# 查看最近的提交
git log --oneline -5

# 如果需要回滾
git revert HEAD
git push origin main
```

## Netlify 環境變數設置 (可選)

雖然不是必需的,但你可以在 Netlify 明確設置環境變數:

1. 登入 Netlify: https://app.netlify.com
2. 選擇 `hexstrike-ai-fe` 專案
3. Site settings > Environment variables
4. 添加變數:
   ```
   Key: NEXT_PUBLIC_HEXSTRIKE_API_URL
   Value: https://hexstrike-ai.dennisleehappy.org
   ```
5. 儲存後觸發重新部署

