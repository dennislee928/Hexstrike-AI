# 批量更新 API URLs
# 此腳本將所有硬編碼的舊 Render URL 替換為新的自訂域名 URL

$oldUrl = "https://hexstrike-ai-v6-0.onrender.com"
$newUrl = "https://hexstrike-ai.dennisleehappy.org"

# 獲取所有需要更新的 TypeScript 檔案
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse
$files += Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

$totalFiles = 0
$updatedFiles = 0

Write-Host "開始掃描並更新 API URLs..." -ForegroundColor Cyan
Write-Host "舊 URL: $oldUrl" -ForegroundColor Yellow
Write-Host "新 URL: $newUrl" -ForegroundColor Green
Write-Host ""

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match [regex]::Escape($oldUrl)) {
        Write-Host "更新: $($file.FullName)" -ForegroundColor Yellow
        $newContent = $content -replace [regex]::Escape($oldUrl), $newUrl
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $updatedFiles++
    }
}

Write-Host ""
Write-Host "完成!" -ForegroundColor Green
Write-Host "掃描的檔案: $totalFiles" -ForegroundColor Cyan
Write-Host "更新的檔案: $updatedFiles" -ForegroundColor Green

