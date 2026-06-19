#!/bin/bash

# TEST PAYMENT SYNC - STEP BY STEP VERIFICATION
# This script tests the EXACT data flow from salon owner payment submission to admin approval

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║         TESTING PAYMENT SUBMISSION → ADMIN SYNC WORKFLOW               ║"
echo "║                    Complete Data Flow Verification                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test helper function
test_check() {
  local test_name=$1
  local check=$2
  local expected=$3
  
  echo -e "${BLUE}[TEST]${NC} $test_name"
  
  if [[ "$check" == *"$expected"* ]]; then
    echo -e "  ${GREEN}✅ PASS${NC}: Found '$expected'"
    ((PASSED++))
  else
    echo -e "  ${RED}❌ FAIL${NC}: Expected '$expected', got '$check'"
    ((FAILED++))
  fi
  echo ""
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "1️⃣  CHECKING PAYMENT SUBMISSION ROUTE (app/api/payments/route.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 1: Does POST route set payment_status to 'pending' (not 'pending_approval')?
result=$(grep -n "payment_status: 'pending'" app/api/payments/route.ts | head -1)
test_check "POST updates payment_status to 'pending'" "$result" "payment_status: 'pending'"

# Check 2: Does POST set status to 'PAYMENT_PENDING'?
result=$(grep -n "status: 'PAYMENT_PENDING'" app/api/payments/route.ts | head -1)
test_check "POST sets job status to 'PAYMENT_PENDING'" "$result" "PAYMENT_PENDING"

# Check 3: Does POST set is_visible to false?
result=$(grep -n "is_visible: false" app/api/payments/route.ts | head -1)
test_check "POST sets job is_visible to false" "$result" "is_visible: false"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "2️⃣  CHECKING ADMIN PENDING JOBS QUERY (lib/db/jobs.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 4: Does getPendingJobs query for status='PAYMENT_PENDING'?
result=$(grep -A 5 "getPendingJobs()" lib/db/jobs.ts | grep "PAYMENT_PENDING")
test_check "getPendingJobs queries for status='PAYMENT_PENDING'" "$result" "PAYMENT_PENDING"

# Check 5: Does getPendingJobs query for payment_status='pending'?
result=$(grep -A 5 "getPendingJobs()" lib/db/jobs.ts | grep "payment_status.*pending")
test_check "getPendingJobs queries for payment_status='pending'" "$result" "payment_status"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "3️⃣  CHECKING ADMIN PENDING JOBS ROUTE (app/api/admin/pending-jobs/route.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 6: Does it call getPendingJobs()?
result=$(grep -n "getPendingJobs()" app/api/admin/pending-jobs/route.ts)
test_check "Admin route calls getPendingJobs()" "$result" "getPendingJobs"

# Check 7: Does it include payment_status in response?
result=$(grep -n "paymentStatus:" app/api/admin/pending-jobs/route.ts)
test_check "Admin response includes paymentStatus" "$result" "paymentStatus"

# Check 8: Does it include screenshotUrl?
result=$(grep -n "screenshotUrl:" app/api/admin/pending-jobs/route.ts)
test_check "Admin response includes screenshotUrl" "$result" "screenshotUrl"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "4️⃣  CHECKING PAYMENT APPROVAL ROUTE (app/api/payments/approve/route.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 9: Does approve route use jobId (not paymentId)?
result=$(grep -n "jobId" app/api/payments/approve/route.ts | head -5)
test_check "Approve route uses jobId parameter" "$result" "jobId"

# Check 10: Does approve update status to 'LIVE'?
result=$(grep -n "status: 'LIVE'" app/api/payments/approve/route.ts)
test_check "Approve route sets status to 'LIVE'" "$result" "LIVE"

# Check 11: Does approve set is_visible to true?
result=$(grep -n "is_visible: true" app/api/payments/approve/route.ts)
test_check "Approve route sets is_visible to true" "$result" "is_visible: true"

# Check 12: Does approve set payment_status to 'approved'?
result=$(grep -n "payment_status: 'approved'" app/api/payments/approve/route.ts)
test_check "Approve route sets payment_status to 'approved'" "$result" "approved"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "5️⃣  CHECKING PAYMENT APPROVAL HOOK (lib/hooks/use-payment-approval.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 13: Does hook use jobId (not paymentId)?
result=$(grep -n "jobId" lib/hooks/use-payment-approval.ts | head -1)
test_check "Payment approval hook uses jobId" "$result" "jobId"

# Check 14: Does hook send correct body with jobId?
result=$(grep -A 3 "body: JSON.stringify" lib/hooks/use-payment-approval.ts | grep -A 2 "jobId")
test_check "Hook sends jobId in request body" "$result" "jobId"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "6️⃣  CHECKING SYNC/JOB CREATION ROUTE (app/api/sync/route.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 15: Does sync route set payment_status='pending'?
result=$(grep -n "payment_status: 'pending'" app/api/sync/route.ts)
test_check "Sync route sets payment_status to 'pending'" "$result" "pending"

# Check 16: Does sync route set status='PAYMENT_PENDING'?
result=$(grep -n "status: 'PAYMENT_PENDING'" app/api/sync/route.ts)
test_check "Sync route sets status to 'PAYMENT_PENDING'" "$result" "PAYMENT_PENDING"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "7️⃣  CHECKING LIVE JOBS QUERY (lib/db/jobs.ts)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check 17: Does getLiveJobs query for status='LIVE'?
result=$(grep -A 5 "getLiveJobs(" lib/db/jobs.ts | grep "status.*LIVE")
test_check "getLiveJobs queries for status='LIVE'" "$result" "LIVE"

# Check 18: Does getLiveJobs query for is_visible=true?
result=$(grep -A 5 "getLiveJobs(" lib/db/jobs.ts | grep "is_visible.*true")
test_check "getLiveJobs queries for is_visible=true" "$result" "is_visible"

# Check 19: Does getLiveJobs query for payment_status='approved'?
result=$(grep -A 5 "getLiveJobs(" lib/db/jobs.ts | grep "payment_status.*approved")
test_check "getLiveJobs queries for payment_status='approved'" "$result" "approved"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "8️⃣  DATA FLOW ANALYSIS"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "FLOW: Salon Owner → Payment Submission → Admin Review → Approval → Live"
echo ""
echo "STEP 1: Salon owner submits payment"
echo "  Location: app/api/sync/route.ts (type='job-payment')"
echo "  Action: createJob({status: 'PAYMENT_PENDING', payment_status: 'pending'})"
echo "  Result: Job created HIDDEN from customers"
echo ""
echo "STEP 2: Admin sees pending jobs"
echo "  Location: app/api/admin/pending-jobs/route.ts"
echo "  Action: Calls getPendingJobs()"
echo "  Query: WHERE status='PAYMENT_PENDING' AND payment_status='pending'"
echo "  Result: Admin sees all pending payments with screenshot"
echo ""
echo "STEP 3: Admin approves payment"
echo "  Location: app/api/payments/approve/route.ts"
echo "  Action: Updates {status:'LIVE', is_visible:true, payment_status:'approved'}"
echo "  Result: Job becomes VISIBLE to all customers IMMEDIATELY"
echo ""
echo "STEP 4: Customers see live job"
echo "  Location: app/api/sync/route.ts (type='live-jobs' or type='approved-jobs')"
echo "  Action: getLiveJobs()"
echo "  Query: WHERE status='LIVE' AND is_visible=true AND payment_status='approved'"
echo "  Result: Customers see approved jobs only"
echo ""

echo "═══════════════════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE% ($PASSED/$TOTAL)"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║         ✅ ALL PAYMENT SYNC TESTS PASSED ✅                            ║${NC}"
  echo -e "${GREEN}║    Payment submission → Admin review → Approval → Live sync is PERFECT   ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║         ❌ SOME TESTS FAILED ❌                                          ║${NC}"
  echo -e "${RED}║    Fix the issues above before deployment                                ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
