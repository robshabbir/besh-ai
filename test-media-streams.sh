#!/bin/bash
# Test script for Twilio Media Streams implementation

set -e

echo "================================================"
echo "  Calva Media Streams Test Suite"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3100}"
PHONE_NUMBER="+19297557288"

echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Phone: $PHONE_NUMBER"
echo ""

# Check environment variables
echo "================================================"
echo "1. Checking Environment Variables"
echo "================================================"

check_env() {
  local var_name=$1
  local var_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d '=' -f2-)
  
  if [ -z "$var_value" ]; then
    echo -e "${RED}✗${NC} $var_name: NOT SET"
    return 1
  else
    echo -e "${GREEN}✓${NC} $var_name: SET"
    return 0
  fi
}

ENV_OK=true

check_env "TWILIO_ACCOUNT_SID" || ENV_OK=false
check_env "TWILIO_AUTH_TOKEN" || ENV_OK=false
check_env "GEMINI_API_KEY" || ENV_OK=false
check_env "ELEVENLABS_API_KEY" || ENV_OK=false
check_env "DEEPGRAM_API_KEY" || ENV_OK=false
check_env "BASE_URL" || ENV_OK=false

echo ""

if [ "$ENV_OK" = false ]; then
  echo -e "${RED}ERROR: Missing required environment variables${NC}"
  echo "Please check .env file and MEDIA_STREAMS_SETUP.md"
  exit 1
fi

# Test API Keys
echo "================================================"
echo "2. Testing API Keys"
echo "================================================"

ELEVENLABS_KEY=$(grep "^ELEVENLABS_API_KEY=" .env | cut -d '=' -f2-)
DEEPGRAM_KEY=$(grep "^DEEPGRAM_API_KEY=" .env | cut -d '=' -f2-)

# Test ElevenLabs
echo -n "Testing ElevenLabs API... "
if curl -s -H "xi-api-key: $ELEVENLABS_KEY" \
  https://api.elevenlabs.io/v1/user | grep -q "subscription"; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "Check your ElevenLabs API key"
fi

# Test Deepgram (if key is set)
if [ -n "$DEEPGRAM_KEY" ]; then
  echo -n "Testing Deepgram API... "
  if curl -s -H "Authorization: Token $DEEPGRAM_KEY" \
    https://api.deepgram.com/v1/projects | grep -q "projects"; then
    echo -e "${GREEN}✓ OK${NC}"
  else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "Deepgram API key may be invalid. Get a free key at:"
    echo "https://console.deepgram.com/signup"
  fi
else
  echo -e "${YELLOW}⚠ DEEPGRAM_API_KEY not set${NC}"
  echo "Get a free key at: https://console.deepgram.com/signup"
fi

echo ""

# Check if server is running
echo "================================================"
echo "3. Checking Server Status"
echo "================================================"

echo -n "Testing server health endpoint... "
if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ OK${NC}"
  
  # Show server stats
  HEALTH=$(curl -s "$BASE_URL/health")
  echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
  echo -e "${RED}✗ FAILED${NC}"
  echo ""
  echo "Server not running at $BASE_URL"
  echo "Start with: npm start"
  exit 1
fi

echo ""

# Test voice-stream endpoint
echo "================================================"
echo "4. Testing Media Streams Endpoint"
echo "================================================"

echo -n "Testing /api/voice-stream endpoint... "
RESPONSE=$(curl -s -X POST "$BASE_URL/api/voice-stream" \
  -d "CallSid=test_$(date +%s)" \
  -d "To=%2B19297557288" \
  -d "From=%2B15551234567")

if echo "$RESPONSE" | grep -q "<Stream"; then
  echo -e "${GREEN}✓ OK${NC}"
  echo ""
  echo "TwiML Response:"
  echo "$RESPONSE" | head -20
else
  echo -e "${RED}✗ FAILED${NC}"
  echo ""
  echo "Response:"
  echo "$RESPONSE"
  exit 1
fi

echo ""

# Check WebSocket paths
echo "================================================"
echo "5. WebSocket Endpoints"
echo "================================================"

WS_URL=$(echo "$BASE_URL" | sed 's/^http/ws/')

echo "Available WebSocket endpoints:"
echo "  • ConversationRelay: ${WS_URL}/ws"
echo "  • Media Streams:     ${WS_URL}/ws/media-stream"
echo ""

# Test database
echo "================================================"
echo "6. Database Check"
echo "================================================"

if [ -f "data/calva.db" ]; then
  echo -e "${GREEN}✓${NC} Database exists: data/calva.db"
  
  # Count tenants
  TENANT_COUNT=$(sqlite3 data/calva.db "SELECT COUNT(*) FROM tenants;" 2>/dev/null || echo "0")
  echo "  Tenants: $TENANT_COUNT"
  
  # Count calls
  CALL_COUNT=$(sqlite3 data/calva.db "SELECT COUNT(*) FROM calls;" 2>/dev/null || echo "0")
  echo "  Calls: $CALL_COUNT"
else
  echo -e "${YELLOW}⚠${NC} Database not found"
  echo "Run: npm run setup"
fi

echo ""

# Test instructions
echo "================================================"
echo "7. Manual Test Instructions"
echo "================================================"

echo ""
echo "To test with a real phone call:"
echo ""
echo "1. Update Twilio webhook:"
echo "   https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
echo "   → Phone: $PHONE_NUMBER"
echo "   → Webhook: $BASE_URL/api/voice-stream"
echo ""
echo "2. Call: $PHONE_NUMBER"
echo ""
echo "3. Monitor logs:"
echo "   tail -f /path/to/calva.log"
echo ""
echo "Expected behavior:"
echo "  • Greeting plays immediately (ElevenLabs Sarah voice)"
echo "  • Natural conversation with <1s latency"
echo "  • Barge-in works (interrupt AI mid-sentence)"
echo "  • Accurate transcription (Deepgram)"
echo "  • Intelligent responses (Gemini 2.0 Flash)"
echo ""

# Summary
echo "================================================"
echo "Summary"
echo "================================================"
echo ""

if [ "$ENV_OK" = true ]; then
  echo -e "${GREEN}✓ Environment configured${NC}"
  echo -e "${GREEN}✓ Server running${NC}"
  echo -e "${GREEN}✓ Media Streams endpoint working${NC}"
  echo ""
  echo -e "${GREEN}Ready to test!${NC} 🚀"
  echo ""
  echo "Next steps:"
  echo "1. Add Deepgram API key to .env (if not already)"
  echo "2. Update Twilio webhook to /api/voice-stream"
  echo "3. Make a test call to $PHONE_NUMBER"
else
  echo -e "${RED}✗ Configuration issues detected${NC}"
  echo ""
  echo "Please fix the issues above and run this script again."
  exit 1
fi

echo ""
echo "================================================"
echo "  Test Complete"
echo "================================================"
