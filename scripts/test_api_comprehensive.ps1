# ============================================================================
# HexStrike AI - Comprehensive Production API Test
# ============================================================================
# Fix encoding issues and output JSON results
# ============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

param(
    [string]$BaseUrl = "https://hexstrike-ai.dennisleehappy.org",
    [string]$OutputDir = "API-Test-Logs"
)

$ErrorActionPreference = "Continue"

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Test results collection
$TestResults = @()
$StartTime = Get-Date

function Test-APIEndpoint {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    $uri = "$BaseUrl$Path"
    $testStart = Get-Date
    
    try {
        $params = @{
            Uri = $uri
            Method = $Method
            TimeoutSec = 30
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $duration = ((Get-Date) - $testStart).TotalMilliseconds
        
        $content = try { $response.Content | ConvertFrom-Json } catch { $response.Content }
        
        $result = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            category = $Category
            test_name = $Name
            method = $Method
            endpoint = $Path
            status = "PASS"
            http_code = $response.StatusCode
            expected_code = $ExpectedStatus
            duration_ms = [math]::Round($duration, 2)
            response_size = $response.Content.Length
            response_preview = if ($content) { 
                ($content | ConvertTo-Json -Compress).Substring(0, [Math]::Min(200, ($content | ConvertTo-Json -Compress).Length))
            } else { 
                $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)) 
            }
            error = $null
        }
        
        Write-Host "[PASS] $Name" -ForegroundColor Green
        Write-Host "  -> $Method $Path ($([math]::Round($duration, 0))ms)" -ForegroundColor Gray
        
        $script:TestResults += $result
        return $true
    }
    catch {
        $duration = ((Get-Date) - $testStart).TotalMilliseconds
        $statusCode = if ($_.Exception.Response) { 
            $_.Exception.Response.StatusCode.value__ 
        } else { 
            0 
        }
        
        $result = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            category = $Category
            test_name = $Name
            method = $Method
            endpoint = $Path
            status = "FAIL"
            http_code = $statusCode
            expected_code = $ExpectedStatus
            duration_ms = [math]::Round($duration, 2)
            response_size = 0
            response_preview = $null
            error = $_.Exception.Message
        }
        
        Write-Host "[FAIL] $Name - HTTP $statusCode" -ForegroundColor Red
        Write-Host "  -> $Method $Path" -ForegroundColor Gray
        Write-Host "  -> Error: $($_.Exception.Message)" -ForegroundColor Yellow
        
        $script:TestResults += $result
        return $false
    }
}

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  HexStrike AI - Production API Comprehensive Test" -ForegroundColor Cyan
Write-Host "  Server: $BaseUrl" -ForegroundColor Cyan
Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Category 1: Core System Endpoints
# ============================================================================
Write-Host "`n[1] Core System Endpoints" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

Test-APIEndpoint -Category "Core" -Name "Health Check" -Path "/health"
Test-APIEndpoint -Category "Core" -Name "System Telemetry" -Path "/api/telemetry"
Test-APIEndpoint -Category "Core" -Name "Cache Statistics" -Path "/api/cache/stats"
Test-APIEndpoint -Category "Core" -Name "Process List" -Path "/api/processes/list"
Test-APIEndpoint -Category "Core" -Name "Process Dashboard" -Path "/api/processes/dashboard"

# ============================================================================
# Category 2: Intelligence & Decision Engine
# ============================================================================
Write-Host "`n[2] Intelligence & Decision Engine" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

Test-APIEndpoint -Category "Intelligence" -Name "Analyze Target" -Method POST -Path "/api/intelligence/analyze-target" `
    -Body @{target = "http://testphp.vulnweb.com"; analysis_type = "quick"}

Test-APIEndpoint -Category "Intelligence" -Name "Select Tools" -Method POST -Path "/api/intelligence/select-tools" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "reconnaissance"}

Test-APIEndpoint -Category "Intelligence" -Name "Create Attack Chain" -Method POST -Path "/api/intelligence/create-attack-chain" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "web_application"}

Test-APIEndpoint -Category "Intelligence" -Name "Smart Scan" -Method POST -Path "/api/intelligence/smart-scan" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "reconnaissance"; max_tools = 3}

# ============================================================================
# Category 3: v7.0 LLM Endpoints
# ============================================================================
Write-Host "`n[3] v7.0 LLM Endpoints" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

Test-APIEndpoint -Category "LLM" -Name "LLM Enhanced Scan" -Method POST -Path "/api/intelligence/llm-enhanced-scan" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "comprehensive"}

Test-APIEndpoint -Category "LLM" -Name "RAG Knowledge Search" -Method POST -Path "/api/intelligence/rag-search" `
    -Body @{query = "SQL Injection bypass techniques"; k = 3}

# ============================================================================
# Category 4: Vulnerability Intelligence
# ============================================================================
Write-Host "`n[4] Vulnerability Intelligence" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

Test-APIEndpoint -Category "CVE" -Name "CVE Search" -Method POST -Path "/api/cve/search" `
    -Body @{query = "apache"; limit = 5}

Test-APIEndpoint -Category "CVE" -Name "CVE Details" -Method POST -Path "/api/cve/details" `
    -Body @{cve_id = "CVE-2021-44228"}

# ============================================================================
# Category 5: Exploit Generation
# ============================================================================
Write-Host "`n[5] Exploit Generation" -ForegroundColor Yellow
Write-Host "-" * 80 -ForegroundColor DarkGray

Test-APIEndpoint -Category "Exploit" -Name "Generate Payload" -Method POST -Path "/api/ai/advanced-payload-generation" `
    -Body @{
        attack_type = "xss"
        target_context = @{url = "http://testphp.vulnweb.com"; parameter = "search"}
        evasion_level = "low"
    }

Test-APIEndpoint -Category "Exploit" -Name "Correlation Analysis" -Method POST -Path "/api/ai/correlation-analysis" `
    -Body @{
        findings = @(
            @{vulnerability = "XSS"; severity = "medium"; location = "/search"}
            @{vulnerability = "SQLi"; severity = "high"; location = "/login"}
        )
    }

# ============================================================================
# Summary & Output
# ============================================================================
$EndTime = Get-Date
$TotalDuration = ($EndTime - $StartTime).TotalSeconds

$passed = ($TestResults | Where-Object {$_.status -eq "PASS"}).Count
$failed = ($TestResults | Where-Object {$_.status -eq "FAIL"}).Count
$total = $TestResults.Count
$passRate = if ($total -gt 0) { [math]::Round(($passed/$total)*100, 2) } else { 0 }

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests:    $total" -ForegroundColor White
Write-Host "  Passed:         " -NoNewline
Write-Host "$passed" -ForegroundColor Green
Write-Host "  Failed:         " -NoNewline
Write-Host "$failed" -ForegroundColor Red
Write-Host "  Pass Rate:      " -NoNewline
if ($passRate -ge 80) {
    Write-Host "$passRate%" -ForegroundColor Green
} elseif ($passRate -ge 50) {
    Write-Host "$passRate%" -ForegroundColor Yellow
} else {
    Write-Host "$passRate%" -ForegroundColor Red
}
Write-Host "  Duration:       $([math]::Round($TotalDuration, 2))s" -ForegroundColor White
Write-Host ""

# Error Analysis
$errorsByCode = $TestResults | Where-Object {$_.status -eq "FAIL"} | Group-Object http_code
if ($errorsByCode) {
    Write-Host "  Error Breakdown:" -ForegroundColor Yellow
    foreach ($group in $errorsByCode) {
        Write-Host "    HTTP $($group.Name): $($group.Count) failures" -ForegroundColor Red
    }
    Write-Host ""
}

# Category Analysis
$byCategory = $TestResults | Group-Object category
Write-Host "  Results by Category:" -ForegroundColor Cyan
foreach ($cat in $byCategory) {
    $catPassed = ($cat.Group | Where-Object {$_.status -eq "PASS"}).Count
    $catTotal = $cat.Count
    $catRate = [math]::Round(($catPassed/$catTotal)*100, 1)
    $color = if ($catRate -ge 80) {"Green"} elseif ($catRate -ge 50) {"Yellow"} else {"Red"}
    Write-Host "    $($cat.Name): $catPassed/$catTotal ($catRate%)" -ForegroundColor $color
}

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan

# Generate JSON output
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$jsonFile = Join-Path $OutputDir "test_results_$timestamp.json"
$reportFile = Join-Path $OutputDir "test_report_$timestamp.txt"

# Save JSON results
$jsonOutput = @{
    test_run = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        server = $BaseUrl
        duration_seconds = [math]::Round($TotalDuration, 2)
    }
    summary = @{
        total_tests = $total
        passed = $passed
        failed = $failed
        pass_rate = $passRate
    }
    results = $TestResults
    errors = @{
        by_http_code = $errorsByCode | ForEach-Object {
            @{
                http_code = $_.Name
                count = $_.Count
                endpoints = $_.Group | Select-Object -ExpandProperty endpoint
            }
        }
    }
}

$jsonOutput | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonFile -Encoding UTF8
Write-Host "`nJSON results saved to: $jsonFile" -ForegroundColor Green

# Generate text report
$reportContent = "=" * 80 + "`n"
$reportContent += "HexStrike AI - Production API Test Report`n"
$reportContent += "=" * 80 + "`n"
$reportContent += "Test Run: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$reportContent += "Server: $BaseUrl`n"
$reportContent += "Duration: $([math]::Round($TotalDuration, 2)) seconds`n`n"

$reportContent += "=" * 80 + "`n"
$reportContent += "SUMMARY`n"
$reportContent += "=" * 80 + "`n"
$reportContent += "Total Tests:  $total`n"
$reportContent += "Passed:       $passed`n"
$reportContent += "Failed:       $failed`n"
$reportContent += "Pass Rate:    $passRate%`n`n"

$reportContent += "=" * 80 + "`n"
$reportContent += "RESULTS BY CATEGORY`n"
$reportContent += "=" * 80 + "`n"
foreach ($cat in $byCategory) {
    $catPassed = ($cat.Group | Where-Object {$_.status -eq "PASS"}).Count
    $catTotal = $cat.Count
    $catRate = [math]::Round(($catPassed/$catTotal)*100, 1)
    $reportContent += "  [$($cat.Name)] $catPassed/$catTotal ($catRate%)`n"
}
$reportContent += "`n"

$reportContent += "=" * 80 + "`n"
$reportContent += "DETAILED RESULTS`n"
$reportContent += "=" * 80 + "`n"
foreach ($result in $TestResults) {
    $reportContent += "[$($result.status)] $($result.test_name)`n"
    $reportContent += "  Category: $($result.category)`n"
    $reportContent += "  Endpoint: $($result.method) $($result.endpoint)`n"
    $reportContent += "  HTTP Code: $($result.http_code) (Expected: $($result.expected_code))`n"
    $reportContent += "  Duration: $($result.duration_ms)ms`n"
    if ($result.error) {
        $reportContent += "  Error: $($result.error)`n"
    } else {
        $reportContent += "  Response: $($result.response_preview)...`n"
    }
    $reportContent += "`n"
}

if ($errorsByCode) {
    $reportContent += "=" * 80 + "`n"
    $reportContent += "ERRORS ANALYSIS`n"
    $reportContent += "=" * 80 + "`n"
    foreach ($group in $errorsByCode) {
        $reportContent += "HTTP $($group.Name): $($group.Count) failures`n"
        $reportContent += "Affected Endpoints:`n"
        foreach ($err in $group.Group) {
            $reportContent += "  - $($err.method) $($err.endpoint)`n"
        }
        $reportContent += "`n"
    }
}

$reportContent += "=" * 80 + "`n"
$reportContent += "End of Report`n"
$reportContent += "=" * 80 + "`n"

$reportContent | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "Text report saved to: $reportFile" -ForegroundColor Green

Write-Host "`nTest completed successfully!" -ForegroundColor Green
Write-Host "Check $OutputDir for detailed results.`n" -ForegroundColor Gray

# Return exit code
if ($failed -gt 0) { exit 1 } else { exit 0 }
