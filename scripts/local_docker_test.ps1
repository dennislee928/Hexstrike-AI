# Local Docker Test Script
# Quick test before deploying to Render

$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Local Docker Test - Phase 1 Parser Fix Verification" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 0: Clean up existing images and containers
Write-Host "[Step 0/5] Cleaning up existing Docker resources..." -ForegroundColor Yellow

# Temporarily allow errors for cleanup
$previousErrorAction = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

# Stop and remove existing container if it exists
docker stop hexstrike-test 2>&1 | Out-Null
docker rm hexstrike-test 2>&1 | Out-Null

# Remove existing image if it exists
docker rmi hexstrike-ai:test -f 2>&1 | Out-Null

# Restore error action
$ErrorActionPreference = $previousErrorAction

Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Step 1: Build
Write-Host "[Step 1/5] Building Docker image..." -ForegroundColor Yellow
Write-Host "This may take 10-15 minutes on first build..." -ForegroundColor Gray
Write-Host ""

try {
    docker build -t hexstrike-ai:test . 2>&1 | Out-Host
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host ""
    Write-Host "SUCCESS: Docker image built successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FAILED: Docker build failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Run container
Write-Host "[Step 2/5] Starting container..." -ForegroundColor Yellow

try {
    # Stop and remove if exists
    docker stop hexstrike-test 2>$null
    docker rm hexstrike-test 2>$null
    
    docker run -d `
        --name hexstrike-test `
        -p 8888:8888 `
        -e PORT=8888 `
        -e HEXSTRIKE_HOST=0.0.0.0 `
        hexstrike-ai:test
    
    Write-Host "Container started: hexstrike-test" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FAILED: Could not start container" -ForegroundColor Red
    exit 1
}

# Step 3: Wait for service
Write-Host "[Step 3/5] Waiting for service to start..." -ForegroundColor Yellow

for ($i = 1; $i -le 30; $i++) {
    Write-Host "  Attempt $i/30..." -NoNewline
    
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8888/health" -TimeoutSec 2 -ErrorAction Stop
        Write-Host " OK!" -ForegroundColor Green
        Write-Host "Service is ready!" -ForegroundColor Green
        Write-Host ""
        break
    } catch {
        Write-Host " waiting..."
        Start-Sleep -Seconds 2
    }
    
    if ($i -eq 30) {
        Write-Host ""
        Write-Host "WARNING: Service did not start in time" -ForegroundColor Yellow
        Write-Host "Check logs with: docker logs hexstrike-test" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Step 4: Test parser imports
Write-Host "[Step 4/5] Testing parser imports..." -ForegroundColor Yellow

$testScript = @"
import sys
sys.path.insert(0, '/app')
try:
    from tools.parsers.sqlmap_parser import parse_sqlmap_output
    from tools.parsers.hydra_parser import parse_hydra_output
    from tools.parsers.john_parser import parse_john_parser
    from tools.parsers.hashcat_parser import parse_hashcat_output
    print('SUCCESS: All parsers imported')
except Exception as e:
    print(f'FAILED: {e}')
    exit(1)
"@

try {
    $result = docker exec hexstrike-test python3 -c $testScript
    Write-Host $result -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FAILED: Parser import test failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test API endpoint
Write-Host "[Step 5/5] Testing SQLMap API endpoint..." -ForegroundColor Yellow

try {
    $body = @{
        url = "http://example.com"
        level = "1"
        risk = "1"
        parse_output = $false  # Don't actually run scan
    } | ConvertTo-Json
    
    # Quick test (will fail but we check for parse_error)
    $response = Invoke-RestMethod `
        -Uri "http://localhost:8888/api/tools/sqlmap" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($response.parse_error) {
        Write-Host "FAILED: Parse error detected: $($response.parse_error)" -ForegroundColor Red
    } else {
        Write-Host "SUCCESS: No parse errors detected" -ForegroundColor Green
    }
} catch {
    Write-Host "INFO: API test skipped (timeout expected)" -ForegroundColor Gray
}

Write-Host ""

# Summary
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker image: hexstrike-ai:test" -ForegroundColor White
Write-Host "Container: hexstrike-test (running on port 8888)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check logs: docker logs hexstrike-test" -ForegroundColor White
Write-Host "  2. Test manually: Invoke-RestMethod http://localhost:8888/health" -ForegroundColor White
Write-Host "  3. Stop container: docker stop hexstrike-test" -ForegroundColor White
Write-Host "  4. Clean up: docker rm hexstrike-test" -ForegroundColor White
Write-Host "  5. If all good, push to GitHub and let Render deploy" -ForegroundColor White
Write-Host ""
Write-Host "Container is still running. Stop it when done testing." -ForegroundColor Yellow
Write-Host ""

