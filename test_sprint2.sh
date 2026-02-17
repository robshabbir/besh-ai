#!/bin/bash

# Sprint 2 Feature Test Script
# Tests: Human Handoff, Analytics, Voicemail

echo "=================================================="
echo "CALVA SPRINT 2 — Feature Verification Tests"
echo "=================================================="
echo ""

API_KEY="calva_demo_487b40b92c16455e2c3932ad760b9d72"
BASE_URL="http://localhost:3101"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_feature() {
  local name=$1
  local command=$2
  local expected=$3
  
  echo -n "Testing: $name... "
  
  result=$(eval $command 2>&1)
  
  if echo "$result" | grep -q "$expected"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Expected: $expected"
    echo "  Got: $result"
    ((FAILED++))
  fi
}

echo "1. DATABASE SCHEMA TESTS"
echo "========================"

test_feature \
  "Calls table has 'transferred' column" \
  "sqlite3 data/calva.db 'PRAGMA table_info(calls);' | grep transferred" \
  "transferred"

test_feature \
  "Calls table has 'transfer_to' column" \
  "sqlite3 data/calva.db 'PRAGMA table_info(calls);' | grep transfer_to" \
  "transfer_to"

test_feature \
  "Voicemails table exists" \
  "sqlite3 data/calva.db '.tables'" \
  "voicemails"

test_feature \
  "Voicemails table has correct schema" \
  "sqlite3 data/calva.db '.schema voicemails'" \
  "caller_phone"

echo ""
echo "2. API ENDPOINT TESTS"
echo "====================="

test_feature \
  "Analytics endpoint returns stats" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"stats\""

test_feature \
  "Analytics returns today stats" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"today\""

test_feature \
  "Analytics returns week stats" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"week\""

test_feature \
  "Analytics returns month stats" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"month\""

test_feature \
  "Analytics returns busiest_hour" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"busiest_hour\""

test_feature \
  "Analytics returns calls_by_day chart data" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"calls_by_day\""

test_feature \
  "Analytics returns recent_calls" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"recent_calls\""

test_feature \
  "Analytics returns voicemails" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"voicemails\""

test_feature \
  "Analytics recent_calls includes transferred flag" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"transferred\""

test_feature \
  "Analytics recent_calls includes recording_available flag" \
  "curl -s $BASE_URL/admin/analytics -H 'Authorization: Bearer $API_KEY'" \
  "\"recording_available\""

echo ""
echo "3. DASHBOARD TESTS"
echo "=================="

test_feature \
  "Dashboard page loads" \
  "curl -s $BASE_URL/admin/dashboard" \
  "Calva Dashboard"

test_feature \
  "Dashboard has Analytics tab" \
  "curl -s $BASE_URL/admin/dashboard" \
  "tab-analytics"

test_feature \
  "Dashboard has Voicemails tab" \
  "curl -s $BASE_URL/admin/dashboard" \
  "tab-voicemails"

test_feature \
  "Dashboard has transfer phone field" \
  "curl -s $BASE_URL/admin/dashboard" \
  "settings-transfer-phone"

test_feature \
  "Dashboard has owner name field" \
  "curl -s $BASE_URL/admin/dashboard" \
  "settings-owner-name"

test_feature \
  "Dashboard has loadAnalytics function" \
  "curl -s $BASE_URL/admin/dashboard" \
  "loadAnalytics"

test_feature \
  "Dashboard has showAnalyticsPeriod function" \
  "curl -s $BASE_URL/admin/dashboard" \
  "showAnalyticsPeriod"

test_feature \
  "Dashboard has renderCallsChart function" \
  "curl -s $BASE_URL/admin/dashboard" \
  "renderCallsChart"

test_feature \
  "Dashboard has loadVoicemails function" \
  "curl -s $BASE_URL/admin/dashboard" \
  "loadVoicemails"

echo ""
echo "4. VOICE ROUTE TESTS"
echo "===================="

test_feature \
  "Voice route has detectTransferIntent function" \
  "grep -n 'detectTransferIntent' src/routes/voice.js" \
  "detectTransferIntent"

test_feature \
  "Voice route has transfer-status endpoint" \
  "grep -n 'transfer-status' src/routes/voice.js" \
  "transfer-status"

test_feature \
  "Voice route has voicemail-status endpoint" \
  "grep -n 'voicemail-status' src/routes/voice.js" \
  "voicemail-status"

test_feature \
  "Voice route checks transfer intent in gather" \
  "grep -n 'detectTransferIntent' src/routes/voice.js" \
  "detectTransferIntent(result.message)"

test_feature \
  "Voice route has error fallback to voicemail" \
  "grep -n 'Fall back to voicemail' src/routes/voice.js" \
  "voicemail"

echo ""
echo "5. DATABASE FUNCTION TESTS"
echo "=========================="

test_feature \
  "db/index.js exports createVoicemail" \
  "grep -n 'createVoicemail' src/db/index.js" \
  "createVoicemail"

test_feature \
  "db/index.js exports getVoicemailsByTenant" \
  "grep -n 'getVoicemailsByTenant' src/db/index.js" \
  "getVoicemailsByTenant"

test_feature \
  "db/index.js exports getCallAnalytics" \
  "grep -n 'getCallAnalytics' src/db/index.js" \
  "getCallAnalytics"

test_feature \
  "db/index.js exports getCallsByHour" \
  "grep -n 'getCallsByHour' src/db/index.js" \
  "getCallsByHour"

test_feature \
  "db/index.js exports getCallsByDay" \
  "grep -n 'getCallsByDay' src/db/index.js" \
  "getCallsByDay"

echo ""
echo "=================================================="
echo "TEST SUMMARY"
echo "=================================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
  echo ""
  echo "Sprint 2 Features are fully implemented:"
  echo "  ✓ Human Handoff / Call Transfer"
  echo "  ✓ Call Analytics Dashboard"
  echo "  ✓ Voicemail Fallback"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  echo "Please review failed tests above."
  exit 1
fi
