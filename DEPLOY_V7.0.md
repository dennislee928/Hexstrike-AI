# HexStrike AI v7.0 - LLM Integration Deployment Guide

## 📋 Overview

HexStrike AI v7.0 introduces LLM-powered intelligence with OpenAI GPT-4 + LangChain + RAG.

## ✅ What's Been Completed

### 1. Core LLM Integration
- ✅ `core/llm_engine.py` - LLMEnhancedDecisionEngine with GPT-4
- ✅ `core/rag_knowledge_base.py` - ChromaDB vector database integration
- ✅ `hexstrike_server.py` - New API endpoints added
- ✅ `requirements.txt` - LLM dependencies added
- ✅ `env.example` - Configuration template updated
- ✅ Unit tests created (`tests/test_llm_engine.py`)
- ✅ Integration test script (`scripts/test_llm_integration.py`)

### 2. Documentation
- ✅ README.md updated to v7.0
- ✅ Architecture diagram updated with LLM components
- ✅ API documentation includes new endpoints

### 3. Security
- ✅ **Snyk Code Scan: 0 issues in new LLM code** 🔒
- ✅ All new modules pass security validation

## 🚀 Deployment Steps

### Step 1: Rebuild Docker Image

The current production Docker image does not include v7.0 LLM dependencies. You need to rebuild:

```bash
# 1. Navigate to project directory
cd C:\Users\dennis.lee\Documents\GitHub\Hexstrike-AI

# 2. Build new Docker image with LLM support
docker build -t dennisleetw/hexstrike-ai:v7.0 -t dennisleetw/hexstrike-ai:latest .

# 3. Test locally (optional)
docker run -d -p 8888:8888 --name hexstrike-test dennisleetw/hexstrike-ai:v7.0

# 4. Verify LLM dependencies are installed
docker exec hexstrike-test pip list | findstr -i "openai langchain chromadb"

# Expected output:
# chromadb         0.3.23
# langchain        1.0.3
# langchain-community 0.4.1
# langchain-core   1.0.3
# langchain-openai 1.0.2
# openai           2.7.1
```

### Step 2: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push versioned image
docker push dennisleetw/hexstrike-ai:v7.0

# Push latest tag
docker push dennisleetw/hexstrike-ai:latest
```

### Step 3: Update Production Environment

#### Option A: Render.com (Current Deployment)

1. **Trigger Redeploy**:
   - Go to Render.com dashboard
   - Select "hexstrike-ai" service
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - Or push to GitHub main branch to trigger auto-deploy

2. **Add Environment Variables** (if using LLM features):
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   LLM_MODEL=gpt-4-turbo-preview
   LLM_TEMPERATURE=0.1
   ENABLE_LLM=true
   ENABLE_RAG=true
   CHROMA_DB_PATH=/app/data/chroma_db
   ```

3. **Verify Deployment**:
   ```bash
   curl https://hexstrike-ai.dennisleehappy.org/health
   ```

#### Option B: Manual Docker Container Update

If running on a VPS or local server:

```bash
# Stop and remove old container
docker stop hexstrike
docker rm hexstrike

# Pull latest image
docker pull dennisleetw/hexstrike-ai:latest

# Run with environment variables (optional LLM features)
docker run -d \
  -p 10000:10000 \
  --name hexstrike \
  -e OPENAI_API_KEY="sk-your-key" \
  -e ENABLE_LLM="true" \
  -e ENABLE_RAG="true" \
  dennisleetw/hexstrike-ai:latest
```

### Step 4: Test v7.0 Endpoints

#### Test 1: Health Check
```bash
curl https://hexstrike-ai.dennisleehappy.org/health
# Expected: {"status":"ok"}
```

#### Test 2: LLM Enhanced Scan (if LLM enabled)
```bash
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/intelligence/llm-enhanced-scan \
  -H "Content-Type: application/json" \
  -d '{
    "target": "http://testphp.vulnweb.com",
    "objective": "comprehensive"
  }'
```

#### Test 3: RAG Knowledge Search (if RAG enabled)
```bash
curl -X POST https://hexstrike-ai.dennisleehappy.org/api/intelligence/rag-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SQL Injection bypass techniques",
    "k": 5
  }'
```

## 📊 Current Status

### ✅ Development Environment
- All code implemented and tested
- Dependencies installed successfully
- Snyk security scan: **0 issues** in new code
- Base functionality verified

### ⚠️ Production Environment
- Health check: ✅ Working
- LLM endpoints: ⚠️ 503 Error (dependencies not in container)
- **Action Required**: Rebuild and redeploy Docker image

## 🔧 Configuration Options

### Without LLM (Rule-based Engine Only)
Default behavior - no configuration needed. System automatically falls back to rule-based engine.

### With LLM (Full Intelligence)
Set environment variables:
```bash
OPENAI_API_KEY=sk-your-actual-api-key
ENABLE_LLM=true
LLM_MODEL=gpt-4-turbo-preview  # or gpt-4, gpt-3.5-turbo
LLM_TEMPERATURE=0.1
```

### With RAG (Knowledge Base)
```bash
ENABLE_RAG=true
CHROMA_DB_PATH=/app/data/chroma_db
# Ensure directory exists and is writable
```

## 🎯 Features by Configuration

| Feature | No Config | ENABLE_LLM=true | ENABLE_LLM + ENABLE_RAG |
|---------|-----------|-----------------|-------------------------|
| Rule-based Decision Engine | ✅ | ✅ | ✅ |
| GPT-4 Tool Selection | ❌ | ✅ | ✅ |
| Smart Parameter Optimization | ❌ | ✅ | ✅ |
| Context-Aware Attack Chains | ❌ | ✅ | ✅ |
| Security Knowledge Retrieval | ❌ | ❌ | ✅ |
| Professional Report Generation | ❌ | ✅ | ✅ |
| Graceful Degradation | ✅ | ✅ | ✅ |

## 📝 Notes

1. **API Costs**: LLM features use OpenAI API (paid service). Monitor usage at https://platform.openai.com/usage

2. **Performance**: 
   - Rule-based: <100ms response time
   - LLM-enhanced: 2-10s (depends on API latency)

3. **Fallback**: If OPENAI_API_KEY is invalid or missing, system automatically uses rule-based engine

4. **Security**: All Snyk scans passed. LLM modules have 0 security issues.

## 🔗 Related Files

- `core/llm_engine.py` - LLM decision engine
- `core/rag_knowledge_base.py` - RAG implementation
- `tests/test_llm_engine.py` - Unit tests
- `scripts/test_llm_integration.py` - Integration tests
- `env.example` - Configuration template
- `requirements.txt` - Updated dependencies

## 📞 Support

For issues or questions about v7.0 deployment:
- Check logs: `docker logs hexstrike`
- Verify dependencies: `docker exec hexstrike pip list`
- Test locally before production deployment

---

**Version**: 7.0.0  
**Date**: 2025-11-06  
**Status**: Code Complete - Deployment Pending

