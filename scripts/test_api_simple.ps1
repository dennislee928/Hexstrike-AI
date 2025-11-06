# ============================================================================
# HexStrike AI - Simple Production API Test
# ============================================================================

$BaseUrl = "https://hexstrike-ai.dennisleehappy.org"
$Results = @()

function Test-API {
    param($Name, $Method = "GET", $Path, $Body = $null)
    
    try {
        $params = @{
            Uri = "$BaseUrl$Path"
            Method = $Method
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        $script:Results += [PSCustomObject]@{
            Test = $Name
            Status = "PASS"
            Code = 200
            Response = ($response | ConvertTo-Json -Compress).Substring(0, [Math]::Min(100, ($response | ConvertTo-Json -Compress).Length))
        }
        Write-Host "[PASS] $Name" -ForegroundColor Green
        Write-Host "  Response: $(($response | ConvertTo-Json -Compress).Substring(0, 100))..." -ForegroundColor Gray
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $script:Results += [PSCustomObject]@{
            Test = $Name
            Status = "FAIL"
            Code = $statusCode
            Response = $_.Exception.Message
        }
        Write-Host "[FAIL] $Name - $statusCode" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n=== HexStrike AI Production API Test ===" -ForegroundColor Cyan
Write-Host "Server: $BaseUrl`n" -ForegroundColor Yellow

# Core Endpoints
Write-Host "`n[1] Core System Endpoints" -ForegroundColor Yellow
Test-API "Health Check" -Path "/health"

# Intelligence Endpoints  
Write-Host "`n[2] Intelligence & Decision Engine" -ForegroundColor Yellow
Test-API "Analyze Target" -Method POST -Path "/api/intelligence/analyze-target" `
    -Body @{target="http://testphp.vulnweb.com"; analysis_type="quick"}

Test-API "Create Attack Chain" -Method POST -Path "/api/intelligence/create-attack-chain" `
    -Body @{target="http://testphp.vulnweb.com"; objective="reconnaissance"}

# v7.0 LLM Endpoints
Write-Host "`n[3] v7.0 LLM Endpoints (May fail until deployment)" -ForegroundColor Yellow
Test-API "LLM Enhanced Scan" -Method POST -Path "/api/intelligence/llm-enhanced-scan" `
    -Body @{target="http://testphp.vulnweb.com"; objective="comprehensive"}

Test-API "RAG Knowledge Search" -Method POST -Path "/api/intelligence/rag-search" `
    -Body @{query="SQL Injection"; k=3}

# Summary
Write-Host "`n=== Test Results Summary ===" -ForegroundColor Cyan
$passed = ($Results | Where-Object {$_.Status -eq "PASS"}).Count
$failed = ($Results | Where-Object {$_.Status -eq "FAIL"}).Count
$total = $Results.Count

Write-Host "Total: $total | Passed: $passed | Failed: $failed" -ForegroundColor White
Write-Host "`nPass Rate: $([math]::Round(($passed/$total)*100, 2))%" -ForegroundColor $(if($passed -eq $total){"Green"}else{"Yellow"})

# Display results table
$Results | Format-Table -AutoSize

Write-Host "`nTest completed at $(Get-Date)" -ForegroundColor Gray

