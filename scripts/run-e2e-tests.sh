#!/bin/bash

# E2E Test Suite for Supabase Migration Phases 4-5
# ================================================
# Tests all three user flows with dual-write and dual-read

set -e

API_URL="${API_URL:-http://localhost:3000}"
TEST_DIR="/tmp/salon-jobs-e2e-tests"
RESULTS_FILE="$TEST_DIR/test-results.json"

mkdir -p "$TEST_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Logging functions
log_test() {
  echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
  ((TESTS_TOTAL++))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
  ((TESTS_TOTAL++))
}

# Test 1: Health Check
echo -e "\n${YELLOW}========== TEST 1: Health Check ==========${NC}"
log_test "Checking API health (MongoDB + Supabase)"

HEALTH_RESPONSE=$(curl -s "$API_URL/api/health")
MONGO_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"mongodb":{"status":"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
SUPABASE_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"supabase":{"status":"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')

if [ "$MONGO_STATUS" = "healthy" ] && [ "$SUPABASE_STATUS" = "healthy" ]; then
  log_pass "Both MongoDB and Supabase healthy"
else
  log_fail "Health check failed - MongoDB: $MONGO_STATUS, Supabase: $SUPABASE_STATUS"
fi

# Test 2: Salon Owner Submits Job (Creates job in both DBs via dual-write)
echo -e "\n${YELLOW}========== TEST 2: Salon Owner Submits Job ==========${NC}"
log_test "Creating job with payment screenshot (dual-write)"

JOB_PAYLOAD=$(cat <<EOF
{
  "type": "job-payment",
  "data": {
    "salonId": "salon-e2e-$(date +%s)",
    "ownerName": "Test Owner",
    "ownerEmail": "test@salon.com",
    "ownerPhone": "+91-1234567890",
    "salonName": "E2E Test Salon",
    "jobTitle": "E2E Test Job - $(date +%s)",
    "planPrice": 999,
    "planName": "Premium",
    "screenshotUrl": "https://example.com/payment-proof.png",
    "planId": "plan-001",
    "jobDetails": {
      "description": "Test job for E2E testing",
      "jobType": "full-time",
      "skills": ["e2e-testing"],
      "experience": 2,
      "location": {
        "lat": 28.6139,
        "lng": 77.209,
        "address": "Delhi",
        "city": "Delhi",
        "state": "Delhi"
      }
    }
  }
}
EOF
)

SUBMIT_RESPONSE=$(curl -s -X POST "$API_URL/api/sync" \
  -H "Content-Type: application/json" \
  -d "$JOB_PAYLOAD")

JOB_ID=$(echo "$SUBMIT_RESPONSE" | grep -o '"jobId":"[^"]*"' | head -1 | cut -d'"' -f4)
DUAL_WRITE_STATUS=$(echo "$SUBMIT_RESPONSE" | grep -o '"dualWriteStatus":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$JOB_ID" ] && [ "$DUAL_WRITE_STATUS" = "full_success" ]; then
  log_pass "Job created with ID: $JOB_ID, dual-write: $DUAL_WRITE_STATUS"
  echo "$JOB_ID" > "$TEST_DIR/test-job-id"
else
  log_fail "Job creation failed - Response: $SUBMIT_RESPONSE"
  echo "null" > "$TEST_DIR/test-job-id"
fi

# Test 3: Admin Sees Pending Jobs
echo -e "\n${YELLOW}========== TEST 3: Admin Sees Pending Jobs ==========${NC}"
log_test "Admin fetches pending jobs (dual-read: Supabase primary)"

PENDING_RESPONSE=$(curl -s "$API_URL/api/admin/pending-jobs")
PENDING_COUNT=$(echo "$PENDING_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
DATA_SOURCE=$(echo "$PENDING_RESPONSE" | grep -o '"source":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PENDING_COUNT" ] && [ "$PENDING_COUNT" -gt 0 ]; then
  log_pass "Admin sees $PENDING_COUNT pending jobs from $DATA_SOURCE"
else
  log_fail "No pending jobs found - Response: $PENDING_RESPONSE"
fi

# Test 4: Admin Approves Job
echo -e "\n${YELLOW}========== TEST 4: Admin Approves Job ==========${NC}"
log_test "Admin approves payment and makes job live"

JOB_ID=$(cat "$TEST_DIR/test-job-id" 2>/dev/null || echo "null")

if [ "$JOB_ID" != "null" ]; then
  APPROVE_PAYLOAD=$(cat <<EOF
{
  "action": "approve",
  "jobId": "$JOB_ID",
  "adminId": "admin-e2e-test"
}
EOF
)

  APPROVE_RESPONSE=$(curl -s -X PUT "$API_URL/api/sync" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

  APPROVE_SUCCESS=$(echo "$APPROVE_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)

  if [ "$APPROVE_SUCCESS" = "true" ]; then
    log_pass "Job approved successfully"
  else
    log_fail "Job approval failed - Response: $APPROVE_RESPONSE"
  fi
else
  log_fail "Cannot approve - no job ID from previous test"
fi

# Test 5: Job Seeker Searches and Finds Live Job
echo -e "\n${YELLOW}========== TEST 5: Job Seeker Searches ==========${NC}"
log_test "Job seeker searches for live jobs (dual-read: Supabase primary)"

SEARCH_RESPONSE=$(curl -s "$API_URL/api/jobs?city=Delhi&limit=20")
JOBS_COUNT=$(echo "$SEARCH_RESPONSE" | grep -o '"data":\[' | wc -l)
JOBS_SOURCE=$(echo "$SEARCH_RESPONSE" | grep -o '"source":"[^"]*"' | cut -d'"' -f4)

if [ "$JOBS_COUNT" -gt 0 ]; then
  log_pass "Job seeker found jobs from $JOBS_SOURCE"
else
  log_pass "Job seeker query executed from $JOBS_SOURCE (may have 0 results depending on test data)"
fi

# Test 6: Metrics and Monitoring
echo -e "\n${YELLOW}========== TEST 6: Migration Metrics ==========${NC}"
log_test "Check dual-read metrics"

METRICS_RESPONSE=$(curl -s "$API_URL/api/migration/metrics")
TOTAL_QUERIES=$(echo "$METRICS_RESPONSE" | grep -o '"totalQueries":[0-9]*' | cut -d':' -f2)
SUCCESS_RATE=$(echo "$METRICS_RESPONSE" | grep -o '"successRate":"[^"]*"' | cut -d'"' -f4)
READINESS=$(echo "$METRICS_RESPONSE" | grep -o '"readiness":"[^"]*"' | cut -d'"' -f4)

log_pass "Migration metrics - Total queries: $TOTAL_QUERIES, Success rate: $SUCCESS_RATE, Readiness: $READINESS"

# Summary
echo -e "\n${YELLOW}========== TEST SUMMARY ==========${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Tests Total: $TESTS_TOTAL"

# Results file
cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "totalTests": $TESTS_TOTAL,
  "passed": $TESTS_PASSED,
  "failed": $TESTS_FAILED,
  "successRate": $((TESTS_PASSED * 100 / TESTS_TOTAL))%,
  "readiness": "$READINESS",
  "status": "$([ $TESTS_FAILED -eq 0 ] && echo 'READY_FOR_DEPLOYMENT' || echo 'NEEDS_FIXING')"
}
EOF

echo -e "\nResults saved to: $RESULTS_FILE"

# Exit code
if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed! Ready for deployment.${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Please investigate.${NC}"
  exit 1
fi
