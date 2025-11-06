#!/bin/bash
# ============================================================================
# HexStrike AI - Realistic Penetration Testing API Test
# ============================================================================
# Purpose: Test actual security testing capabilities with real targets
# ============================================================================

set +e  # Continue on errors
BASE_URL="${1:-https://hexstrike-ai.dennisleehappy.org}"
OUTPUT_DIR="API-Test-Logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
JSON_RESULTS="$OUTPUT_DIR/realistic_test_results_$TIMESTAMP.json"
LOG_FILE="$OUTPUT_DIR/realistic_test_log_$TIMESTAMP.txt"

# Safe test targets (intentionally vulnerable for testing)
SAFE_TARGET="http://testphp.vulnweb.com"
SAFE_DOMAIN="testphp.vulnweb.com"
SAFE_IP="scanme.nmap.org"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# JSON results array
JSON_RESULTS_ARRAY="[]"

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_key="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "${BLUE}[TEST]${NC} $test_name"
    log "  ${CYAN}→${NC} $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check for expected key or HTTP 200
    if [ "$http_code" = "200" ]; then
        if [ -z "$expected_key" ] || echo "$body" | grep -q "\"$expected_key\""; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            log "${GREEN}[PASS]${NC} $test_name (HTTP $http_code)"
            if [ ! -z "$expected_key" ]; then
                value=$(echo "$body" | grep -o "\"$expected_key\":[^,}]*" | head -1)
                log "  ${CYAN}→${NC} $value"
            fi
            # Show response preview
            preview=$(echo "$body" | head -c 150)
            log "  ${CYAN}Preview:${NC} $preview..."
            status="PASS"
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            log "${RED}[FAIL]${NC} Expected key '$expected_key' not found"
            status="FAIL"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log "${RED}[FAIL]${NC} $test_name (HTTP $http_code)"
        log "  ${YELLOW}Response:${NC} $body"
        status="FAIL"
    fi
    
    # Add to JSON results
    json_entry=$(cat <<EOF
{
  "test_name": "$test_name",
  "method": "$method",
  "endpoint": "$endpoint",
  "status": "$status",
  "http_code": $http_code,
  "timestamp": "$(date -Iseconds)"
}
EOF
)
    JSON_RESULTS_ARRAY=$(echo "$JSON_RESULTS_ARRAY" | jq ". += [$json_entry]" 2>/dev/null || echo "[]")
    
    log ""
}

# ============================================================================
# Start Testing
# ============================================================================
log "$(echo -e "${CYAN}============================================================================${NC}")"
log "$(echo -e "${CYAN}🎯 HexStrike AI - Realistic Penetration Testing Demonstration${NC}")"
log "$(echo -e "${CYAN}============================================================================${NC}")"
log "Target Server: $BASE_URL"
log "Test Target: $SAFE_TARGET (Intentionally Vulnerable)"
log "Test Time: $(date)"
log "$(echo -e "${CYAN}============================================================================${NC}")"
log ""

# ============================================================================
# Category 1: Core System Health
# ============================================================================
log "$(echo -e "${YELLOW}[1] Core System Health${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "Health Check" "GET" "/health" "" "status"
test_api "System Telemetry" "GET" "/api/telemetry" "" "system_metrics"
test_api "Cache Statistics" "GET" "/api/cache/stats" "" "hit_rate"

# ============================================================================
# Category 2: AI Intelligence Engine (Core Feature)
# ============================================================================
log "$(echo -e "${YELLOW}[2] AI Intelligence & Decision Engine${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "AI Target Analysis" "POST" "/api/intelligence/analyze-target" \
    "{\"target\":\"$SAFE_TARGET\",\"analysis_type\":\"comprehensive\"}" \
    "target_profile"

test_api "AI Tool Selection" "POST" "/api/intelligence/select-tools" \
    "{\"target\":\"$SAFE_TARGET\",\"objective\":\"bug_bounty\"}" \
    "selected_tools"

test_api "AI Attack Chain Creation" "POST" "/api/intelligence/create-attack-chain" \
    "{\"target\":\"$SAFE_TARGET\",\"objective\":\"web_application\"}" \
    "attack_chain"

test_api "AI Parameter Optimization" "POST" "/api/intelligence/optimize-parameters" \
    "{\"tool\":\"nmap\",\"target\":\"$SAFE_IP\",\"context\":{\"stealth\":true}}" \
    "optimized_parameters"

# ============================================================================
# Category 3: Network Reconnaissance Tools
# ============================================================================
log "$(echo -e "${YELLOW}[3] Network Reconnaissance${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "Nmap Quick Scan" "POST" "/api/tools/nmap/scan" \
    "{\"target\":\"$SAFE_IP\",\"scan_type\":\"-sn\",\"additional_args\":\"-T4\"}" \
    "output"

test_api "HTTPx Web Probing" "POST" "/api/tools/httpx/probe" \
    "{\"url\":\"$SAFE_TARGET\",\"follow_redirects\":true}" \
    "status_code"

# ============================================================================
# Category 4: Web Application Security Testing
# ============================================================================
log "$(echo -e "${YELLOW}[4] Web Application Security Testing${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "WhatWeb Technology Detection" "POST" "/api/tools/whatweb/scan" \
    "{\"url\":\"$SAFE_TARGET\",\"aggression\":1}" \
    "technologies"

test_api "Katana Web Crawling" "POST" "/api/tools/katana/crawl" \
    "{\"url\":\"$SAFE_TARGET\",\"depth\":2,\"max_pages\":10}" \
    "urls_found"

test_api "Nuclei Vulnerability Scan" "POST" "/api/tools/nuclei/scan" \
    "{\"target\":\"$SAFE_TARGET\",\"severity\":\"info,low\",\"templates\":\"\"}" \
    "findings"

test_api "Directory Enumeration (Gobuster)" "POST" "/api/tools/gobuster" \
    "{\"url\":\"$SAFE_TARGET\",\"wordlist\":\"/usr/share/wordlists/dirb/common.txt\",\"threads\":10,\"timeout\":30}" \
    "directories_found"

# ============================================================================
# Category 5: Bug Bounty Workflows
# ============================================================================
log "$(echo -e "${YELLOW}[5] Bug Bounty Automation${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "Bug Bounty Reconnaissance" "POST" "/api/workflows/bug-bounty/reconnaissance" \
    "{\"domain\":\"$SAFE_DOMAIN\",\"scope\":\"subdomain_enum\"}" \
    "subdomains"

test_api "Technology Detection Workflow" "POST" "/api/detection/technology" \
    "{\"url\":\"$SAFE_TARGET\"}" \
    "detected_technologies"

# ============================================================================
# Category 6: Vulnerability Intelligence
# ============================================================================
log "$(echo -e "${YELLOW}[6] CVE & Vulnerability Intelligence${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "CVE Search - Apache" "POST" "/api/cve/search" \
    "{\"query\":\"apache\",\"limit\":5}" \
    "cves"

test_api "CVE Details - Log4Shell" "POST" "/api/cve/details" \
    "{\"cve_id\":\"CVE-2021-44228\"}" \
    "cve_id"

test_api "Exploit Database Search" "POST" "/api/exploits/search" \
    "{\"query\":\"php\",\"type\":\"webapps\",\"limit\":5}" \
    "exploits"

# ============================================================================
# Category 7: AI Exploit Generation
# ============================================================================
log "$(echo -e "${YELLOW}[7] AI-Powered Exploit Generation${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "XSS Payload Generation" "POST" "/api/ai/advanced-payload-generation" \
    "{\"attack_type\":\"xss\",\"target_context\":{\"url\":\"$SAFE_TARGET\",\"parameter\":\"search\"},\"evasion_level\":\"low\"}" \
    "payloads"

test_api "Vulnerability Correlation" "POST" "/api/ai/correlation-analysis" \
    "{\"findings\":[{\"vulnerability\":\"XSS\",\"severity\":\"medium\",\"location\":\"/search\"},{\"vulnerability\":\"SQLi\",\"severity\":\"high\",\"location\":\"/login\"}]}" \
    "attack_chain"

# ============================================================================
# Category 8: Process & Execution Management
# ============================================================================
log "$(echo -e "${YELLOW}[8] Process Management${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "Active Processes List" "GET" "/api/processes/list" "" "active_processes"
test_api "Process Dashboard" "GET" "/api/processes/dashboard" "" "system_load"

# ============================================================================
# Category 9: v7.0 LLM Features (Expected to fail until deployment)
# ============================================================================
log "$(echo -e "${YELLOW}[9] v7.0 LLM-Powered Features${NC}")"
log "$(echo -e "${CYAN}────────────────────────────────────────────────────────────────────────────${NC}")"

test_api "LLM Enhanced Intelligent Scan" "POST" "/api/intelligence/llm-enhanced-scan" \
    "{\"target\":\"$SAFE_TARGET\",\"objective\":\"comprehensive\"}" \
    "attack_chain"

test_api "RAG Security Knowledge Search" "POST" "/api/intelligence/rag-search" \
    "{\"query\":\"SQL injection bypass WAF techniques\",\"k\":5}" \
    "results"

# ============================================================================
# Summary & Results
# ============================================================================
log "$(echo -e "${CYAN}============================================================================${NC}")"
log "$(echo -e "${CYAN}📊 Test Results Summary${NC}")"
log "$(echo -e "${CYAN}============================================================================${NC}")"
log "Total Tests:  $TOTAL_TESTS"
log "$(echo -e "${GREEN}✅ Passed:${NC}     $PASSED_TESTS")"
log "$(echo -e "${RED}❌ Failed:${NC}     $FAILED_TESTS")"
log "$(echo -e "${YELLOW}⚠️  Skipped:${NC}    $SKIPPED_TESTS")"
log "$(echo -e "${CYAN}============================================================================${NC}")"

# Calculate pass rate
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
log "Pass Rate: $PASS_RATE%"
log ""

# Category breakdown
log "$(echo -e "${CYAN}Results by Category:${NC}")"
log "  [1] Core System Health: Essential for operation"
log "  [2] AI Intelligence Engine: ⭐ Core feature - Smart tool selection"
log "  [3] Network Reconnaissance: Port scanning & host discovery"
log "  [4] Web Security Testing: XSS, SQLi, directory enum"
log "  [5] Bug Bounty Workflows: Automated recon & hunting"
log "  [6] Vulnerability Intelligence: CVE & exploit database"
log "  [7] AI Exploit Generation: Smart payload creation"
log "  [8] Process Management: Real-time execution monitoring"
log "  [9] v7.0 LLM Features: GPT-4 enhanced intelligence"
log ""

# Save JSON results
json_output=$(cat <<EOF
{
  "test_metadata": {
    "timestamp": "$(date -Iseconds)",
    "server": "$BASE_URL",
    "test_target": "$SAFE_TARGET",
    "total_tests": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "skipped": $SKIPPED_TESTS,
    "pass_rate": $PASS_RATE
  },
  "test_results": $JSON_RESULTS_ARRAY
}
EOF
)

echo "$json_output" | jq '.' > "$JSON_RESULTS" 2>/dev/null || echo "$json_output" > "$JSON_RESULTS"

log "$(echo -e "${GREEN}📄 JSON results saved to:${NC} $JSON_RESULTS")"
log "$(echo -e "${GREEN}📝 Log file saved to:${NC} $LOG_FILE")"
log ""

# Final verdict
if [ $FAILED_TESTS -eq 0 ]; then
    log "$(echo -e "${GREEN}🎉 All tests passed! HexStrike AI is fully operational.${NC}")"
    exit 0
elif [ $PASS_RATE -ge 70 ]; then
    log "$(echo -e "${YELLOW}⚠️  Some tests failed, but core functionality is working ($PASS_RATE% pass rate).${NC}")"
    exit 0
else
    log "$(echo -e "${RED}❌ Multiple failures detected. Please check server logs.${NC}")"
    exit 1
fi

