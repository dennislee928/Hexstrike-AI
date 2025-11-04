# 🔥 緊急修復：502 Bad Gateway 端口問題

## 問題診斷

**症狀**: 部署成功但所有 API 請求返回 502 Bad Gateway

**根本原因**: 
- Render 平台設置環境變數 `PORT`（通常是動態分配的端口）
- 我們的代碼使用 `HEXSTRIKE_PORT`（固定為 8888）
- 結果：Render 的負載均衡器無法連接到應用

**證據**:
```
日誌顯示：
✅ Flask 運行在 0.0.0.0:8888
❌ 但 Render 期望應用監聽動態 PORT
```

---

## ✅ 已修復

### 修改 1: `hexstrike_server.py`

**修改前**:
```python
API_PORT = int(os.environ.get('HEXSTRIKE_PORT', 8888))
API_HOST = os.environ.get('HEXSTRIKE_HOST', '127.0.0.1')
```

**修改後**:
```python
# 支援 Render 的標準 PORT 環境變數，並向後兼容 HEXSTRIKE_PORT
API_PORT = int(os.environ.get('PORT', os.environ.get('HEXSTRIKE_PORT', '8888')))
API_HOST = os.environ.get('HEXSTRIKE_HOST', '0.0.0.0')
```

**改進**:
- ✅ 優先使用 `PORT`（Render 標準）
- ✅ 向後兼容 `HEXSTRIKE_PORT`（本地開發）
- ✅ HOST 改為 `0.0.0.0`（允許外部連接）

### 修改 2: `docker-entrypoint.sh`

**修改前**:
```bash
HEXSTRIKE_PORT=${HEXSTRIKE_PORT:-8888}
```

**修改後**:
```bash
# 支援 Render 的標準 PORT 環境變數
HEXSTRIKE_PORT=${PORT:-${HEXSTRIKE_PORT:-8888}}
```

**改進**:
- ✅ 優先使用 `PORT`
- ✅ 確保啟動腳本和應用使用相同端口

---

## 🚀 重新部署

### 步驟 1: 提交修復
```bash
git add hexstrike_server.py docker-entrypoint.sh HOTFIX_502_PORT.md
git commit -m "hotfix: 修復 Render 502 錯誤 - 支援 PORT 環境變數"
git push origin main
```

### 步驟 2: 觸發部署
1. 前往 Render Dashboard
2. 選擇 `hexstrike-ai` 服務
3. 點擊 "Manual Deploy" > "Deploy latest commit"
4. 等待部署完成（約 3-5 分鐘，使用快取）

### 步驟 3: 驗證修復
```bash
# 測試健康檢查
curl https://hexstrike-ai.dennisleehappy.org/health

# 預期結果：200 OK
{
  "status": "healthy",
  "message": "HexStrike AI Tools API Server is operational",
  "version": "6.0.0"
}

# 測試工具狀態
curl https://hexstrike-ai.dennisleehappy.org/api/tools/status

# 預期結果：200 OK，工具列表
```

---

## 🔍 Render 端口工作原理

### Render 如何分配端口

1. **動態端口分配**:
   - Render 為每個服務分配一個隨機端口
   - 通過 `PORT` 環境變數傳遞給應用
   - 通常在 10000-60000 範圍

2. **負載均衡器**:
   - Render 的 LB 監聽 443 (HTTPS)
   - 將請求轉發到 `PORT` 指定的端口
   - 如果應用監聽錯誤端口 → 502

3. **健康檢查**:
   - Render 向 `PORT` 發送健康檢查
   - 如果沒有響應 → 服務標記為不健康

### 為什麼之前的日誌顯示成功？

```
✅ "GET / HTTP/1.1" 200
```

這是 **容器內部** 的健康檢查（127.0.0.1），**不是** Render 的外部健康檢查。

Render 的外部檢查失敗了，因為應用監聽 8888 而 Render 期望 PORT（例如 35421）。

---

## 📊 修復前後對比

| 項目 | 修復前 | 修復後 |
|------|--------|--------|
| 端口來源 | 固定 HEXSTRIKE_PORT=8888 | 動態 PORT (Render) |
| HOST 綁定 | 127.0.0.1 | 0.0.0.0 |
| Render 連接 | ❌ 失敗 (502) | ✅ 成功 |
| 本地開發 | ✅ 正常 | ✅ 正常（向後兼容）|

---

## ⚠️ 未來預防措施

### 1. 使用標準環境變數
```bash
# ✅ 推薦：使用 PORT
PORT=8888

# ❌ 避免：自定義變數
HEXSTRIKE_PORT=8888
```

### 2. 確保 HOST 為 0.0.0.0
```python
# ✅ 允許外部連接
app.run(host='0.0.0.0', port=port)

# ❌ 只允許本地連接
app.run(host='127.0.0.1', port=port)
```

### 3. 測試清單
- [ ] 本地測試：`PORT=9999 python hexstrike_server.py`
- [ ] Docker 測試：`docker run -e PORT=10000 -p 10000:10000 image`
- [ ] 健康檢查測試：`curl http://localhost:PORT/health`

---

## 🎯 驗收標準

修復成功的標準：

- [x] 代碼已修改（支援 PORT）
- [ ] Git 已提交並推送
- [ ] Render 重新部署完成
- [ ] `/health` 返回 200
- [ ] `/api/tools/status` 返回 200
- [ ] 前端可以正常調用 API

---

## 📞 如果仍然 502

### 檢查清單

1. **確認 Render 環境變數**:
   ```
   Settings > Environment > PORT
   應該是空的（讓 Render 自動設置）
   ```

2. **查看部署日誌**:
   ```
   查找: "Port: XXXXX"
   確認顯示的是 Render 分配的端口
   ```

3. **測試端口綁定**:
   ```bash
   # 在 Render Shell 中執行
   netstat -tlnp | grep LISTEN
   # 應該看到 Python 監聽 PORT
   ```

4. **檢查健康檢查路徑**:
   ```
   Render Settings > Health Check Path: /
   或: /health
   ```

---

## 📚 相關資源

- Render 端口文件：https://render.com/docs/web-services#port-binding
- Flask 部署最佳實踐：https://flask.palletsprojects.com/en/stable/deploying/
- Gunicorn 配置（未來改進）：https://docs.gunicorn.org/

---

**修復完成**: 2025-11-04  
**預計解決時間**: 5-10 分鐘（重新部署）  
**狀態**: ✅ 準備重新部署

