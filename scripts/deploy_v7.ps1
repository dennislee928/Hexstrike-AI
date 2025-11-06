#!/usr/bin/env pwsh
# ============================================================================
# HexStrike AI v7.0 - Docker Build and Deploy Script
# ============================================================================
# Purpose: Rebuild Docker image with LLM dependencies and deploy
# Author: m0x4m4
# Date: 2025-11-06
# ============================================================================

param(
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$LocalTest,
    [string]$Tag = "v7.0"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green @"

================================================================================
    HexStrike AI v7.0 - LLM Integration Deployment
================================================================================
    
"@

# Configuration
$IMAGE_NAME = "dennisleetw/hexstrike-ai"
$VERSION_TAG = $Tag
$LATEST_TAG = "latest"

Write-Host "[INFO] Configuration:" -ForegroundColor Cyan
Write-Host "  Image: $IMAGE_NAME" -ForegroundColor White
Write-Host "  Version Tag: $VERSION_TAG" -ForegroundColor White
Write-Host "  Latest Tag: $LATEST_TAG" -ForegroundColor White
Write-Host ""

# Step 1: Build Docker Image
if (-not $SkipBuild) {
    Write-ColorOutput Yellow "[Step 1/4] Building Docker image with LLM dependencies..."
    Write-Host "  This may take 10-15 minutes on first build..." -ForegroundColor Gray
    
    try {
        docker build `
            -t "${IMAGE_NAME}:${VERSION_TAG}" `
            -t "${IMAGE_NAME}:${LATEST_TAG}" `
            -f Dockerfile `
            .
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✅ Docker image built successfully!"
        } else {
            throw "Docker build failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-ColorOutput Red "❌ Docker build failed: $_"
        exit 1
    }
} else {
    Write-ColorOutput Yellow "[Step 1/4] Skipping build (using existing image)..."
}

# Step 2: Verify LLM Dependencies
Write-ColorOutput Yellow "`n[Step 2/4] Verifying LLM dependencies in image..."

try {
    # Create temporary container to check dependencies
    $containerId = docker create "${IMAGE_NAME}:${VERSION_TAG}"
    
    # Check for LLM packages
    Write-Host "  Checking for OpenAI..." -ForegroundColor Gray
    $openaiCheck = docker run --rm "${IMAGE_NAME}:${VERSION_TAG}" pip list | Select-String "openai"
    
    Write-Host "  Checking for LangChain..." -ForegroundColor Gray
    $langchainCheck = docker run --rm "${IMAGE_NAME}:${VERSION_TAG}" pip list | Select-String "langchain"
    
    Write-Host "  Checking for ChromaDB..." -ForegroundColor Gray
    $chromadbCheck = docker run --rm "${IMAGE_NAME}:${VERSION_TAG}" pip list | Select-String "chromadb"
    
    # Clean up
    docker rm $containerId -f 2>&1 | Out-Null
    
    if ($openaiCheck -and $langchainCheck -and $chromadbCheck) {
        Write-ColorOutput Green "✅ All LLM dependencies verified!"
        Write-Host "  - openai: $($openaiCheck -replace '\s+', ' ')" -ForegroundColor Gray
        Write-Host "  - langchain: $($langchainCheck -replace '\s+', ' ')" -ForegroundColor Gray
        Write-Host "  - chromadb: $($chromadbCheck -replace '\s+', ' ')" -ForegroundColor Gray
    } else {
        Write-ColorOutput Red "⚠️  Some LLM dependencies are missing!"
        Write-Host "  This may indicate a build issue." -ForegroundColor Yellow
    }
} catch {
    Write-ColorOutput Yellow "⚠️  Could not verify dependencies: $_"
    Write-Host "  Continuing anyway..." -ForegroundColor Gray
}

# Step 3: Local Test (Optional)
if ($LocalTest) {
    Write-ColorOutput Yellow "`n[Step 3/4] Running local test..."
    
    try {
        # Stop and remove existing test container
        Write-Host "  Cleaning up existing test container..." -ForegroundColor Gray
        docker stop hexstrike-v7-test 2>&1 | Out-Null
        docker rm hexstrike-v7-test 2>&1 | Out-Null
        
        # Start new container
        Write-Host "  Starting test container on port 8888..." -ForegroundColor Gray
        docker run -d `
            -p 8888:8888 `
            --name hexstrike-v7-test `
            "${IMAGE_NAME}:${VERSION_TAG}"
        
        # Wait for startup
        Write-Host "  Waiting for server to start..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        
        # Test health endpoint
        Write-Host "  Testing health endpoint..." -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri "http://localhost:8888/health" -Method GET -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput Green "✅ Local test passed! Server is healthy."
            Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
            Write-Host "`n  Test server running at http://localhost:8888" -ForegroundColor Cyan
            Write-Host "  To stop: docker stop hexstrike-v7-test && docker rm hexstrike-v7-test" -ForegroundColor Gray
        } else {
            Write-ColorOutput Yellow "⚠️  Unexpected status code: $($response.StatusCode)"
        }
    } catch {
        Write-ColorOutput Red "❌ Local test failed: $_"
        Write-Host "  Check logs: docker logs hexstrike-v7-test" -ForegroundColor Yellow
    }
} else {
    Write-ColorOutput Yellow "`n[Step 3/4] Skipping local test..."
    Write-Host "  Use -LocalTest flag to test before pushing" -ForegroundColor Gray
}

# Step 4: Push to Docker Hub
if (-not $SkipPush) {
    Write-ColorOutput Yellow "`n[Step 4/4] Pushing to Docker Hub..."
    
    # Check if logged in
    Write-Host "  Verifying Docker Hub authentication..." -ForegroundColor Gray
    $dockerInfo = docker info 2>&1
    if ($dockerInfo -like "*Username:*") {
        Write-ColorOutput Green "  ✅ Logged in to Docker Hub"
    } else {
        Write-ColorOutput Yellow "  ⚠️  Not logged in to Docker Hub"
        Write-Host "  Attempting login..." -ForegroundColor Gray
        docker login
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput Red "❌ Docker Hub login failed"
            exit 1
        }
    }
    
    try {
        Write-Host "`n  Pushing version tag: $VERSION_TAG..." -ForegroundColor Gray
        docker push "${IMAGE_NAME}:${VERSION_TAG}"
        
        Write-Host "  Pushing latest tag..." -ForegroundColor Gray
        docker push "${IMAGE_NAME}:${LATEST_TAG}"
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✅ Successfully pushed to Docker Hub!"
            Write-Host "`n  Images available at:" -ForegroundColor Cyan
            Write-Host "    - docker pull ${IMAGE_NAME}:${VERSION_TAG}" -ForegroundColor White
            Write-Host "    - docker pull ${IMAGE_NAME}:${LATEST_TAG}" -ForegroundColor White
        } else {
            throw "Docker push failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-ColorOutput Red "❌ Push to Docker Hub failed: $_"
        exit 1
    }
} else {
    Write-ColorOutput Yellow "`n[Step 4/4] Skipping push to Docker Hub..."
}

# Summary
Write-ColorOutput Green @"

================================================================================
    Deployment Complete! 🎉
================================================================================

Next Steps:
1. Update production environment (Render.com, VPS, etc.)
2. Pull latest image: docker pull ${IMAGE_NAME}:${LATEST_TAG}
3. Restart containers with new image
4. Test endpoints:
   - Health: https://hexstrike-ai.dennisleehappy.org/health
   - LLM Scan: /api/intelligence/llm-enhanced-scan
   - RAG Search: /api/intelligence/rag-search

Optional LLM Configuration:
Set these environment variables to enable LLM features:
  OPENAI_API_KEY=sk-your-api-key
  ENABLE_LLM=true
  ENABLE_RAG=true

Documentation: See DEPLOY_V7.0.md for detailed instructions

================================================================================

"@

