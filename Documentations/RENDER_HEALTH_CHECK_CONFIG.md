# 🏥 Render 健康檢查配置指南

## 問題：部署持續超時

**症狀**: 服務啟動正常但在 12 分鐘後超時失敗

---

## 🔧 解決方案

### 方法 1：使用 render.yaml 配置文件（推薦）

我已創建 `render.yaml` 文件，請執行：

```bash
# 1. 提交所有更改
git add render.yaml hexstrike_server.py docker-entrypoint.sh
git commit -m "fix: 添加 render.yaml 配置並修復健康檢查"
git push origin main

# 2. 在 Render Dashboard 重新連接
# Render 會自動讀取 render.yaml
```

**render.yaml 關鍵配置**：
```yaml
healthCheckPath: /        # 使用根路徑（最快）
```

---

### 方法 2：手動配置 Render Dashboard

1. **登入 Render Dashboard**
   - https://dashboard.render.com

2. **進入服務設置**
   - 選擇 `hexstrike-ai` 服務
   - 點擊 "Settings"

3. **配置健康檢查**
   ```
   Health & Alerts > Health Check Path
   
   修改為：/
   或保持空白（預設使用 /）
   ```

4. **調整超時設置（可選）**
   ```
   如果有這些選項：
   - Health Check Timeout: 60 秒
   - Health Check Interval: 30 秒
   - Health Check Grace Period: 300 秒（5 分鐘）
   ```

5. **儲存並重新部署**

---

### 方法 3：臨時快速修復 - 禁用健康檢查

**僅用於緊急情況！**

在 Render Settings 中：
1. 找到 "Health Check Path"
2. **留空**或設為 `/`
3. 如果有選項，**禁用健康檢查**（不推薦用於生產）

---

## 🧪 驗證修復

部署成功後，執行以下測試：

### 測試 1：健康檢查端點
```bash
# 快速健康檢查（應該 < 100ms）
time curl https://hexstrike-ai.dennisleehappy.org/health

# 預期輸出：
# {
#   "status": "healthy",
#   "message": "HexStrike AI Tools API Server is operational",
#   "version": "6.0.1",
#   "timestamp": 1699234567.89
# }
# real    0m0.052s
```

### 測試 2：根路徑
```bash
# 測試根路徑（Render 預設檢查的路徑）
curl https://hexstrike-ai.dennisleehappy.org/

# 應該返回 200 OK 和簡單 JSON
```

### 測試 3：工具狀態
```bash
# 測試我們新增的工具狀態端點
curl https://hexstrike-ai.dennisleehappy.org/api/tools/status
```

---

## 📊 健康檢查端點說明

我們現在有**三個**健康檢查端點：

| 端點 | 響應時間 | 用途 | Render 使用 |
|------|---------|------|------------|
| `/` | < 5ms | 最快的存活檢查 | ✅ 推薦 |
| `/health` | < 10ms | 快速健康狀態 | ✅ 推薦 |
| `/health/detailed` | 30-120s | 完整工具檢查 | ❌ 太慢 |

**Render 應該使用 `/` 或 `/health`**

---

## 🔍 故障排查

### 如果仍然超時

#### 檢查 1：確認代碼已部署
```bash
# 在本地檢查
git log --oneline -5

# 應該看到最近的 commit：
# "fix: 添加 render.yaml 配置並修復健康檢查"
# "hotfix: 修復健康檢查超時 - 創建快速 /health 端點"
```

#### 檢查 2：Render 建構日誌
在 Render Dashboard 查看：
1. 最新部署是否包含新代碼
2. 建構是否成功
3. 啟動日誌中是否有錯誤

#### 檢查 3：手動測試健康檢查
```bash
# 如果服務已啟動但 Render 說不健康
# 嘗試手動訪問
curl -v https://hexstrike-ai.dennisleehappy.org/

# 檢查：
# - 是否返回 200
# - 響應時間是否 < 1 秒
# - 是否有錯誤訊息
```

#### 檢查 4：Docker 本地測試
```bash
# 在本地測試 Docker 容器
docker build -t hexstrike-test .
docker run -p 10000:10000 -e PORT=10000 hexstrike-test

# 在另一個終端測試
curl http://localhost:10000/
curl http://localhost:10000/health
```

---

## 🚨 緊急情況：使用替代部署平台

如果 Render 持續有問題，可以考慮：

### Railway.app
```bash
railway login
railway init
railway up
```

### Fly.io
```bash
fly launch
fly deploy
```

### Heroku
```bash
heroku create hexstrike-ai
git push heroku main
```

---

## 📝 Render 支援資源

- [Render 健康檢查文件](https://render.com/docs/health-checks)
- [部署故障排除](https://render.com/docs/troubleshooting-deploys)
- [Render Discord 社群](https://discord.gg/render)

---

## ✅ 最終檢查清單

部署前確認：

- [ ] `hexstrike_server.py` 已修改（快速 /health）
- [ ] `docker-entrypoint.sh` 已修改（PORT 環境變數）
- [ ] `render.yaml` 已創建（健康檢查配置）
- [ ] 所有更改已提交並推送到 GitHub
- [ ] 在 Render 觸發新部署
- [ ] 監控部署日誌
- [ ] 部署成功後測試所有端點

---

**預期結果**：
```
2025-11-04 XX:XX:XX ==> Health check passed ✅
2025-11-04 XX:XX:XX ==> Your service is live 🎉
```

**不再看到**：
```
2025-11-04 XX:XX:XX ==> Timed Out ❌
```

---

**最後更新**: 2025-11-04  
**狀態**: 等待部署測試

