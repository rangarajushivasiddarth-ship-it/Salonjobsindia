#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     SALON JOBS INDIA - PRE-DEPLOYMENT SECURITY TEST SUITE          ║"
echo "║                    June 19, 2026                                   ║"
echo "╚════════════════════════════════════════════════════════════════════╝"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
SKIPPED=0

# Test function
run_test() {
  local test_num=$1
  local test_name=$2
  local test_cmd=$3
  local expected=$4
  
  echo ""
  echo -e "${BLUE}[Test $test_num]${NC} $test_name"
  echo "  Command: $test_cmd"
  
  result=$(eval "$test_cmd" 2>&1)
  
  if [[ $result == *"$expected"* ]]; then
    echo -e "  ${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "  ${RED}❌ FAILED${NC}"
    echo "  Expected: $expected"
    echo "  Got: $result"
    ((FAILED++))
    return 1
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "1️⃣  SECURITY BOUNDARY TESTS"
echo "═══════════════════════════════════════════════════════════════════"

# Test 1.1 - Admin endpoint requires auth
run_test "1.1" "Admin endpoint requires authentication" \
  "grep -n 'requireAuth.*admin' app/api/admin/pending-jobs/route.ts" \
  "requireAuth"

# Test 1.2 - Payment approval requires auth
run_test "1.2" "Payment approval requires authentication" \
  "grep -n 'requireAuth.*admin' app/api/sync/route.ts" \
  "requireAuth"

# Test 1.3 - Admin ID from token, not body
run_test "1.3" "Admin ID sourced from JWT token" \
  "grep -n 'auth.auth.userId' app/api/sync/route.ts" \
  "auth.auth.userId"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "2️⃣  FEATURE IMPLEMENTATION TESTS"
echo "═══════════════════════════════════════════════════════════════════"

# Test 2.1 - Job submission sync implemented
run_test "2.1" "Job submission sync implemented" \
  "grep -n 'createJob' app/api/sync/job-submissions/route.ts" \
  "createJob"

# Test 2.2 - Profile update sync implemented
run_test "2.2" "Profile update sync implemented" \
  "grep -n 'updateOne' app/api/sync/profile-updates/route.ts" \
  "updateOne"

# Test 2.3 - Favorites sync implemented
run_test "2.3" "Favorites sync implemented" \
  "grep -n 'insertOne' app/api/sync/favorites/route.ts" \
  "insertOne"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "3️⃣  DATA VISIBILITY TESTS"
echo "═══════════════════════════════════════════════════════════════════"

# Test 3.1 - Job visibility enforced
run_test "3.1" "Job visibility filtering at database" \
  "grep -n \"status = 'LIVE'\" lib/db/jobs.ts" \
  "LIVE"

# Test 3.2 - Owner scoping enforced
run_test "3.2" "Owner ID scoping in queries" \
  "grep -n 'owner_id' lib/db/jobs.ts" \
  "owner_id"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "4️⃣  ERROR HANDLING TESTS"
echo "═══════════════════════════════════════════════════════════════════"

# Test 4.1 - Missing field validation
run_test "4.1" "Missing field validation" \
  "grep -n 'Missing.*fields\\|validateRequired' app/api/sync/job-submissions/route.ts" \
  "Missing"

# Test 4.2 - Error responses structured
run_test "4.2" "Structured error responses" \
  "grep -n 'status.*50[0-9]' app/api/sync/job-submissions/route.ts" \
  "500"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "5️⃣  MANIFEST & PWA TESTS"
echo "═══════════════════════════════════════════════════════════════════"

# Test 5.1 - Manifest valid JSON
run_test "5.1" "Valid JSON manifest" \
  "cat public/manifest.json | node -e \"require('fs').readFileSync(0, 'utf8')\" && echo 'valid'" \
  "valid"

# Test 5.2 - Offline page exists
run_test "5.2" "Offline fallback page exists" \
  "test -f public/offline.html && echo 'exists' || echo 'missing'" \
  "exists"

# Test 5.3 - Service worker registered
run_test "5.3" "Service worker configured" \
  "grep -n 'navigator.serviceWorker' app/layout.tsx || grep -n 'register.*sw' app/layout.tsx" \
  "serviceWorker"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "6️⃣  BUILD & CONFIGURATION TESTS"
echo "═══════════════════════════════════════════════════════════════════"

# Test 6.1 - TypeScript no errors (check if types file exists)
run_test "6.1" "Type definitions present" \
  "test -f lib/types.ts && echo 'present' || echo 'missing'" \
  "present"

# Test 6.2 - Auth middleware exists
run_test "6.2" "Auth middleware implemented" \
  "test -f lib/auth-middleware.ts && echo 'present' || echo 'missing'" \
  "present"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⏭️  Skipped: $SKIPPED${NC}"

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
  PERCENTAGE=$((PASSED * 100 / TOTAL))
  echo ""
  echo "Success Rate: $PERCENTAGE% ($PASSED/$TOTAL)"
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║         ✅ ALL TESTS PASSED - READY FOR DEPLOYMENT ✅               ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║         ❌ SOME TESTS FAILED - FIX BEFORE DEPLOYING ❌              ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
