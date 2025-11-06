#!/usr/bin/env pwsh
# ============================================================================
# HexStrike AI - Production API Comprehensive Test
# ============================================================================
# Purpose: Test all API endpoints on production server
# URL: https://hexstrike-ai.dennisleehappy.org
# ============================================================================

param(
    [string]$BaseUrl = "https://hexstrike-ai.dennisleehappy.org",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Test results tracking
$script:TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
}

# Colors for output
function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Details = ""
    )
    
    $script:TestResults.Total++
    
    switch ($Status) {
        "PASS" {
            $script:TestResults.Passed++
            Write-Host "[✅ PASS] " -ForegroundColor Green -NoNewline
        }
        "FAIL" {
            $script:TestResults.Failed++
            Write-Host "[❌ FAIL] " -ForegroundColor Red -NoNewline
        }
        "SKIP" {
            $script:TestResults.Skipped++
            Write-Host "[⏭️  SKIP] " -ForegroundColor Yellow -NoNewline
        }
    }
    
    Write-Host "$TestName" -ForegroundColor White
    if ($Details) {
        Write-Host "         $Details" -ForegroundColor Gray
    }
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200,
        [switch]$AllowError
    )
    
    $uri = "$BaseUrl$Path"
    
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
        
        if ($Verbose) {
            Write-Host "  → Testing: $Method $uri" -ForegroundColor Gray
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($content) {
                Write-TestResult -TestName $Name -Status "PASS" -Details "Status: $($response.StatusCode), Response: $(($content | ConvertTo-Json -Compress).Substring(0, [Math]::Min(100, ($content | ConvertTo-Json -Compress).Length)))..."
            } else {
                Write-TestResult -TestName $Name -Status "PASS" -Details "Status: $($response.StatusCode)"
            }
            return $true
        } else {
            Write-TestResult -TestName $Name -Status "FAIL" -Details "Expected $ExpectedStatus but got $($response.StatusCode)"
            return $false
        }
    }
    catch {
        if ($AllowError) {
            Write-TestResult -TestName $Name -Status "SKIP" -Details "Expected error: $($_.Exception.Message)"
            return $null
        } else {
            Write-TestResult -TestName $Name -Status "FAIL" -Details "Error: $($_.Exception.Message)"
            return $false
        }
    }
}

Write-Host @"

╔══════════════════════════════════════════════════════════════════════════╗
║         HexStrike AI - Production API Comprehensive Test                ║
║         Server: $BaseUrl         ║
╚══════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ============================================================================
# Category 1: Core System Endpoints
# ============================================================================
Write-Host "`n📊 Category 1: Core System Endpoints" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Health Check" -Path "/health"
Test-Endpoint -Name "System Telemetry" -Path "/api/telemetry"
Test-Endpoint -Name "Cache Statistics" -Path "/api/cache/stats"
Test-Endpoint -Name "Process List" -Path "/api/processes/list"
Test-Endpoint -Name "Process Dashboard" -Path "/api/processes/dashboard"

# ============================================================================
# Category 2: Intelligence & Decision Engine
# ============================================================================
Write-Host "`n🧠 Category 2: Intelligence & Decision Engine" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Analyze Target" -Method POST -Path "/api/intelligence/analyze-target" `
    -Body @{target = "http://testphp.vulnweb.com"; analysis_type = "quick"}

Test-Endpoint -Name "Select Tools" -Method POST -Path "/api/intelligence/select-tools" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "reconnaissance"}

Test-Endpoint -Name "Create Attack Chain" -Method POST -Path "/api/intelligence/create-attack-chain" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "web_application"}

Test-Endpoint -Name "Smart Scan" -Method POST -Path "/api/intelligence/smart-scan" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "reconnaissance"; max_tools = 3}

# ============================================================================
# Category 3: v7.0 LLM Endpoints (May fail if not yet deployed)
# ============================================================================
Write-Host "`n🤖 Category 3: v7.0 LLM Endpoints" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "LLM Enhanced Scan" -Method POST -Path "/api/intelligence/llm-enhanced-scan" `
    -Body @{target = "http://testphp.vulnweb.com"; objective = "comprehensive"} `
    -AllowError

Test-Endpoint -Name "RAG Knowledge Search" -Method POST -Path "/api/intelligence/rag-search" `
    -Body @{query = "SQL Injection bypass techniques"; k = 3} `
    -AllowError

# ============================================================================
# Category 4: Network Scanning Tools
# ============================================================================
Write-Host "`n🌐 Category 4: Network Scanning Tools" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Nmap Scan" -Method POST -Path "/api/tools/nmap/scan" `
    -Body @{target = "scanme.nmap.org"; scan_type = "-sn"; additional_args = "-T4"}

Test-Endpoint -Name "HTTPx Probe" -Method POST -Path "/api/tools/httpx/probe" `
    -Body @{url = "http://testphp.vulnweb.com"; follow_redirects = $true}

# ============================================================================
# Category 5: Web Application Testing Tools
# ============================================================================
Write-Host "`n🌐 Category 5: Web Application Testing Tools" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Nuclei Scan" -Method POST -Path "/api/tools/nuclei/scan" `
    -Body @{target = "http://testphp.vulnweb.com"; severity = "info,low"; templates = ""}

Test-Endpoint -Name "WhatWeb Fingerprint" -Method POST -Path "/api/tools/whatweb/scan" `
    -Body @{url = "http://testphp.vulnweb.com"; aggression = 1}

Test-Endpoint -Name "Katana Crawl" -Method POST -Path "/api/tools/katana/crawl" `
    -Body @{url = "http://testphp.vulnweb.com"; depth = 2; max_pages = 10}

# ============================================================================
# Category 6: Bug Bounty & CTF Workflows
# ============================================================================
Write-Host "`n🏆 Category 6: Bug Bounty & CTF Workflows" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Bug Bounty Workflow - Recon" -Method POST -Path "/api/workflows/bug-bounty/reconnaissance" `
    -Body @{domain = "testphp.vulnweb.com"; scope = "subdomain_enum"}

Test-Endpoint -Name "Technology Detection" -Method POST -Path "/api/detection/technology" `
    -Body @{url = "http://testphp.vulnweb.com"}

# ============================================================================
# Category 7: CVE Intelligence
# ============================================================================
Write-Host "`n🔍 Category 7: CVE Intelligence" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "CVE Search" -Method POST -Path "/api/cve/search" `
    -Body @{query = "apache"; limit = 5}

Test-Endpoint -Name "CVE Details" -Method POST -Path "/api/cve/details" `
    -Body @{cve_id = "CVE-2021-44228"}

# ============================================================================
# Category 8: Exploit Generation
# ============================================================================
Write-Host "`n💣 Category 8: Exploit Generation" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Generate Payload" -Method POST -Path "/api/ai/advanced-payload-generation" `
    -Body @{
        attack_type = "xss"
        target_context = @{url = "http://testphp.vulnweb.com"; parameter = "search"}
        evasion_level = "low"
    }

# ============================================================================
# Category 9: File Management
# ============================================================================
Write-Host "`n📁 Category 9: File Management" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Create File" -Method POST -Path "/api/file/create" `
    -Body @{filename = "test.txt"; content = "Test content"; binary = $false}

Test-Endpoint -Name "Read File" -Method POST -Path "/api/file/read" `
    -Body @{filename = "test.txt"; binary = $false}

Test-Endpoint -Name "Delete File" -Method POST -Path "/api/file/delete" `
    -Body @{filename = "test.txt"}

# ============================================================================
# Category 10: Advanced Features
# ============================================================================
Write-Host "`n⚡ Category 10: Advanced Features" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Test-Endpoint -Name "Correlation Analysis" -Method POST -Path "/api/ai/correlation-analysis" `
    -Body @{
        findings = @(
            @{vulnerability = "XSS"; severity = "medium"; location = "/search"}
            @{vulnerability = "SQLi"; severity = "high"; location = "/login"}
        )
    }

Test-Endpoint -Name "Vulnerability Correlation" -Method POST -Path "/api/intelligence/correlate-vulnerabilities" `
    -Body @{
        vulnerabilities = @(
            @{type = "LFI"; severity = "medium"; url = "/file.php"}
            @{type = "File Upload"; severity = "high"; url = "/upload.php"}
        )
    }

# ============================================================================
# Summary
# ============================================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                          Test Results Summary                            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$passRate = if ($script:TestResults.Total -gt 0) { 
    [math]::Round(($script:TestResults.Passed / $script:TestResults.Total) * 100, 2) 
} else { 
    0 
}

Write-Host "  Total Tests:   " -NoNewline
Write-Host $script:TestResults.Total -ForegroundColor White

Write-Host "  ✅ Passed:      " -NoNewline
Write-Host $script:TestResults.Passed -ForegroundColor Green

Write-Host "  ❌ Failed:      " -NoNewline
Write-Host $script:TestResults.Failed -ForegroundColor Red

Write-Host "  ⏭️  Skipped:     " -NoNewline
Write-Host $script:TestResults.Skipped -ForegroundColor Yellow

Write-Host "`n  Pass Rate:     " -NoNewline
if ($passRate -ge 80) {
    Write-Host "$passRate%" -ForegroundColor Green
} elseif ($passRate -ge 50) {
    Write-Host "$passRate%" -ForegroundColor Yellow
} else {
    Write-Host "$passRate%" -ForegroundColor Red
}

Write-Host "`n╔══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                              Notes                                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($script:TestResults.Skipped -gt 0) {
    Write-Host "  ℹ️  Some tests were skipped (likely v7.0 LLM endpoints awaiting deployment)" -ForegroundColor Yellow
}

if ($script:TestResults.Failed -gt 0) {
    Write-Host "  ⚠️  Some tests failed - check server logs for details" -ForegroundColor Yellow
    Write-Host "     docker logs hexstrike" -ForegroundColor Gray
}

if ($passRate -ge 80) {
    Write-Host "`n  🎉 Overall Status: " -NoNewline
    Write-Host "HEALTHY" -ForegroundColor Green
} elseif ($passRate -ge 50) {
    Write-Host "`n  ⚠️  Overall Status: " -NoNewline
    Write-Host "DEGRADED" -ForegroundColor Yellow
} else {
    Write-Host "`n  ❌ Overall Status: " -NoNewline
    Write-Host "CRITICAL" -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Return exit code based on results
if ($script:TestResults.Failed -gt 0) {
    exit 1
} else {
    exit 0
}

