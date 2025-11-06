# 本地測試指南

## 步驟 1: Docker Build

```powershell
# 在專案根目錄執行
cd C:\Users\dennis.lee\Documents\GitHub\Hexstrike-AI

# Build Docker image
docker build -t hexstrike-ai:test .

# 預計時間: 10-15 分鐘（首次 build）
```

## 步驟 2: 運行容器

```powershell
# 運行容器
docker run -d `
  --name hexstrike-test `
  -p 8888:8888 `
  -e PORT=8888 `
  -e HEXSTRIKE_HOST=0.0.0.0 `
  hexstrike-ai:test

# 查看日誌
docker logs -f hexstrike-test
```

## 步驟 3: 測試解析器導入

```powershell
# 進入容器
docker exec -it hexstrike-test /bin/bash

# 測試 Python 導入
python3 << EOF
import sys
sys.path.insert(0, '/app')

# 測試導入
from tools.parsers.sqlmap_parser import parse_sqlmap_output
from tools.parsers.hydra_parser import parse_hydra_output
from tools.parsers.john_parser import parse_john_output
from tools.parsers.hashcat_parser import parse_hashcat_output

print("All parsers imported successfully!")
EOF

# 退出容器
exit
```

## 步驟 4: 測試 API

```powershell
# 測試健康檢查
Invoke-RestMethod -Uri "http://localhost:8888/health"

# 測試 SQLMap（簡單測試，不會真正掃描）
$body = @{
    url = "http://testphp.vulnweb.com/artists.php?artist=1"
    level = "1"
    risk = "1"
    parse_output = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:8888/api/tools/sqlmap" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  | ConvertTo-Json -Depth 5
```

## 步驟 5: 清理

```powershell
# 停止容器
docker stop hexstrike-test

# 刪除容器
docker rm hexstrike-test

# 刪除 image（可選）
docker rmi hexstrike-ai:test
```

## 快速測試腳本

創建 `scripts/local_test.ps1`：

```powershell
Write-Host "Building Docker image..." -ForegroundColor Cyan
docker build -t hexstrike-ai:test .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    
    Write-Host "Starting container..." -ForegroundColor Cyan
    docker run -d --name hexstrike-test -p 8888:8888 -e PORT=8888 hexstrike-ai:test
    
    Write-Host "Waiting for service to start..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    Write-Host "Testing health endpoint..." -ForegroundColor Cyan
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8888/health"
        Write-Host "Health check: $($health.status)" -ForegroundColor Green
    } catch {
        Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "Cleaning up..." -ForegroundColor Cyan
    docker stop hexstrike-test
    docker rm hexstrike-test
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
```

