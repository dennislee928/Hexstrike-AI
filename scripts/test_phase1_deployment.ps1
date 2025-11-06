# Phase 1 部署驗證測試腳本
# 測試所有 Phase 1 工具的標準化響應

$API_BASE = "https://hexstrike-ai.dennisleehappy.org"
$ErrorActionPreference = "Continue"

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Phase 1 部署驗證測試" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# 測試結果追蹤
$TestResults = @{
    "Passed" = 0
    "Failed" = 0
    "Skipped" = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [hashtable]$Body = $null,
        [string]$Method = "GET",
        [int]$Timeout = 60
    )
    
    Write-Host "測試: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = $Timeout
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "Request Body:" -ForegroundColor Gray
            Write-Host ($Body | ConvertTo-Json -Depth 2) -ForegroundColor DarkGray
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "✅ 成功" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Gray
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor DarkGray
        Write-Host ""
        
        $script:TestResults.Passed++
        return $response
    }
    catch {
        Write-Host "❌ 失敗: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Status Code: $statusCode" -ForegroundColor Red
            
            if ($statusCode -eq 524) {
                Write-Host "⚠️  Cloudflare 524 錯誤 - 服務器超時" -ForegroundColor Yellow
                Write-Host "建議: 等待幾分鐘後重試，或檢查 Render 日誌" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        $script:TestResults.Failed++
        return $null
    } # 補齊 catch 區塊的結尾大括號
}

function Verify-StandardResponse {
    param(
        [object]$Response,
        [string]$TestName
    )
    
    Write-Host "驗證標準化響應格式: $TestName" -ForegroundColor Cyan
    
    $requiredFields = @("success", "tool", "summary", "findings", "metadata")
    $summaryFields = @("status", "severity", "brief", "findings_count")
    
    $allValid = $true
    
    foreach ($field in $requiredFields) {
        if (-not $Response.PSObject.Properties.Name.Contains($field)) {
            Write-Host "❌ 缺少必需欄位: $field" -ForegroundColor Red
            $allValid = $false
        } else {
            Write-Host "✅ $field" -ForegroundColor Green
        }
    }
    
    if ($Response.summary) {
        foreach ($field in $summaryFields) {
            if (-not $Response.summary.PSObject.Properties.Name.Contains($field)) {
                Write-Host "❌ summary 缺少欄位: $field" -ForegroundColor Red
                $allValid = $false
            } else {
                Write-Host "✅ summary.$field" -ForegroundColor Green
            }
        }
    }
    
    if ($allValid) {
        Write-Host "✅ 響應格式完全符合標準" -ForegroundColor Green
    } else {
        Write-Host "⚠️  響應格式部分不符合標準" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# ==================== 測試開始 ====================

Write-Host "階段 1: 基礎健康檢查" -ForegroundColor Magenta
Write-Host "-" * 80
Write-Host ""

$health = Test-Endpoint -Name "健康檢查（快速）" -Url "$API_BASE/health"

if ($health) {
    Write-Host "服務版本: $($health.version)" -ForegroundColor Cyan
    Write-Host "服務狀態: $($health.status)" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠️  健康檢查失敗，服務可能未就緒" -ForegroundColor Yellow
    Write-Host "建議操作:" -ForegroundColor Yellow
    Write-Host "  1. 檢查 Render Dashboard 的部署狀態" -ForegroundColor White
    Write-Host "  2. 查看 Render 日誌是否有錯誤" -ForegroundColor White
    Write-Host "  3. 等待 2-5 分鐘後重新運行此腳本" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "是否繼續測試其他端點？ (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "階段 2: 工具狀態檢查" -ForegroundColor Magenta
Write-Host "-" * 80
Write-Host ""

$toolStatus = Test-Endpoint -Name "工具安裝狀態" -Url "$API_BASE/api/tools/status"

Write-Host ""
Write-Host "階段 3: SQLMap 標準化響應測試" -ForegroundColor Magenta
Write-Host "-" * 80
Write-Host ""

$sqlmapBody = @{
    url = "http://testphp.vulnweb.com/artists.php?artist=1"
    level = "1"
    risk = "1"
    parse_output = $true
}

$sqlmapResponse = Test-Endpoint `
    -Name "SQLMap 掃描（測試站點）" `
    -Url "$API_BASE/api/tools/sqlmap" `
    -Method "POST" `
    -Body $sqlmapBody `
    -Timeout 120

if ($sqlmapResponse) {
    Verify-StandardResponse -Response $sqlmapResponse -TestName "SQLMap"
}

Write-Host ""
Write-Host "階段 4: Hydra 批次模式測試（跳過 - 需要目標主機）" -ForegroundColor Magenta
Write-Host "-" * 80
Write-Host ""
Write-Host "⏭️  跳過 Hydra 測試（需要實際目標和憑證）" -ForegroundColor Yellow
$script:TestResults.Skipped++

Write-Host ""
Write-Host "階段 5: John the Ripper 測試（跳過 - 需要 hash 文件）" -ForegroundColor Magenta
Write-Host "-" * 80
Write-Host ""
Write-Host "⏭️  跳過 John 測試（需要 hash 文件）" -ForegroundColor Yellow
$script:TestResults.Skipped++

Write-Host ""
Write-Host "階段 6: Hashcat 測試（跳過 - 需要 hash 文件）" -ForegroundColor Magenta
Write-Host "-" * 80
Write-Host ""
Write-Host "⏭️  跳過 Hashcat 測試（需要 hash 文件）" -ForegroundColor Yellow
$script:TestResults.Skipped++

# ==================== 測試總結 ====================

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "測試總結" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ 通過: $($TestResults.Passed)" -ForegroundColor Green
Write-Host "❌ 失敗: $($TestResults.Failed)" -ForegroundColor Red
Write-Host "⏭️  跳過: $($TestResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($TestResults.Failed -eq 0) {
    Write-Host "🎉 所有測試通過！" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  部分測試失敗，請檢查上方錯誤訊息" -ForegroundColor Yellow
    exit 1
}

