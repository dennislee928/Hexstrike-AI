# SQLMap Detailed Test
# Check the actual response structure

$API_BASE = "https://hexstrike-ai.dennisleehappy.org"

Write-Host "Testing SQLMap with detailed output..."
Write-Host ""

$body = @{
    url = "http://testphp.vulnweb.com/artists.php?artist=1"
    level = "1"
    risk = "1"
    parse_output = $true
}

try {
    $response = Invoke-RestMethod `
        -Uri "$API_BASE/api/tools/sqlmap" `
        -Method Post `
        -Body ($body | ConvertTo-Json) `
        -Headers @{"Content-Type" = "application/json"} `
        -TimeoutSec 120
    
    Write-Host "Full Response:"
    Write-Host "================================================================================"
    $response | ConvertTo-Json -Depth 10
    Write-Host "================================================================================"
    Write-Host ""
    
    Write-Host "Response Properties:"
    foreach ($prop in $response.PSObject.Properties) {
        Write-Host "  - $($prop.Name): $($prop.TypeNameOfValue)"
    }
    Write-Host ""
    
    if ($response.parse_error) {
        Write-Host "PARSE ERROR DETECTED!" -ForegroundColor Red
        Write-Host "Error: $($response.parse_error)"
        Write-Host ""
    }
    
    if ($response.parsed -eq $false) {
        Write-Host "Parsing was disabled or failed" -ForegroundColor Yellow
        Write-Host "Parsed flag: $($response.parsed)"
        Write-Host ""
    }
    
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}

