# Phase 1 Deployment Test Script
# Simple version to avoid encoding issues

$API_BASE = "https://hexstrike-ai.dennisleehappy.org"

Write-Host "================================================================================"
Write-Host "Phase 1 Deployment Verification Test"
Write-Host "================================================================================"
Write-Host ""

# Test 1: Health Check
Write-Host "[Test 1] Health Check Endpoint"
Write-Host "--------------------------------------------------------------------------------"

try {
    $health = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get -TimeoutSec 30
    Write-Host "SUCCESS: Health check passed" -ForegroundColor Green
    Write-Host "Status: $($health.status)"
    Write-Host "Version: $($health.version)"
    Write-Host "Message: $($health.message)"
    Write-Host ""
} catch {
    Write-Host "FAILED: Health check failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Note: If you see 524 error, server may be starting up. Wait 2-5 minutes."
    Write-Host ""
}

# Test 2: Tools Status
Write-Host "[Test 2] Tools Status Endpoint"
Write-Host "--------------------------------------------------------------------------------"

try {
    $status = Invoke-RestMethod -Uri "$API_BASE/api/tools/status" -Method Get -TimeoutSec 30
    Write-Host "SUCCESS: Tools status retrieved" -ForegroundColor Green
    Write-Host "Tools installed: $($status.critical_tools.Count)"
    Write-Host ""
} catch {
    Write-Host "FAILED: Tools status check failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 3: SQLMap Standard Response
Write-Host "[Test 3] SQLMap Standardized Response"
Write-Host "--------------------------------------------------------------------------------"

$sqlmapBody = @{
    url = "http://testphp.vulnweb.com/artists.php?artist=1"
    level = "1"
    risk = "1"
    parse_output = $true
}

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $sqlmapResponse = Invoke-RestMethod `
        -Uri "$API_BASE/api/tools/sqlmap" `
        -Method Post `
        -Body ($sqlmapBody | ConvertTo-Json) `
        -Headers $headers `
        -TimeoutSec 120
    
    Write-Host "SUCCESS: SQLMap scan completed" -ForegroundColor Green
    Write-Host "Tool: $($sqlmapResponse.tool)"
    Write-Host "Success: $($sqlmapResponse.success)"
    
    if ($sqlmapResponse.summary) {
        Write-Host ""
        Write-Host "Summary:"
        Write-Host "  Status: $($sqlmapResponse.summary.status)"
        Write-Host "  Severity: $($sqlmapResponse.summary.severity)"
        Write-Host "  Brief: $($sqlmapResponse.summary.brief)"
        Write-Host "  Findings: $($sqlmapResponse.summary.findings_count)"
    }
    
    if ($sqlmapResponse.metadata -and $sqlmapResponse.metadata.recommendations) {
        Write-Host ""
        Write-Host "Recommendations:"
        foreach ($rec in $sqlmapResponse.metadata.recommendations) {
            Write-Host "  - $rec"
        }
    }
    
    Write-Host ""
    Write-Host "Verifying standard response format..."
    
    $requiredFields = @("success", "tool", "summary", "findings", "metadata")
    $allPresent = $true
    
    foreach ($field in $requiredFields) {
        if ($sqlmapResponse.PSObject.Properties.Name -contains $field) {
            Write-Host "  OK: $field" -ForegroundColor Green
        } else {
            Write-Host "  MISSING: $field" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host ""
        Write-Host "VERIFIED: Response format is standardized!" -ForegroundColor Green
    }
    
    Write-Host ""
    
} catch {
    Write-Host "FAILED: SQLMap test failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

# Summary
Write-Host "================================================================================"
Write-Host "Test Summary"
Write-Host "================================================================================"
Write-Host ""
Write-Host "Phase 1 deployment verification completed."
Write-Host "Check the results above for any failures."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. If all tests passed, Phase 1 is ready!"
Write-Host "  2. If some tests failed, check Render logs"
Write-Host "  3. Update frontend to use new response format"
Write-Host "  4. Begin Phase 2 implementation"
Write-Host ""

