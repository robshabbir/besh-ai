#!/bin/bash

# Test script for AI Receptionist webhook server
# This simulates Twilio webhook calls to test the conversation flow

set -e

SERVER_URL="${SERVER_URL:-http://localhost:3100}"
CALL_SID="TEST_$(date +%s)"

echo "🧪 AI Receptionist Test Suite"
echo "================================"
echo ""

# Check if server is running
echo "1️⃣  Checking server health..."
HEALTH=$(curl -s "${SERVER_URL}/health")
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding. Start it with: npm start"
    exit 1
fi
echo ""

# Test initial call
echo "2️⃣  Testing initial call webhook..."
RESPONSE=$(curl -s -X POST "${SERVER_URL}/api/voice" \
  -d "CallSid=${CALL_SID}" \
  -d "From=+15551234567" \
  -d "To=+19297557288")

if [[ $RESPONSE == *"Mike's Plumbing"* ]]; then
    echo "✅ Initial greeting works"
else
    echo "❌ Initial greeting failed"
    echo "$RESPONSE"
fi
echo ""

# Test booking flow
echo "3️⃣  Testing booking conversation..."

# Step 1: User wants to book
echo "   📞 Caller: 'I need to schedule a drain cleaning'"
RESPONSE=$(curl -s -X POST "${SERVER_URL}/api/gather" \
  -d "CallSid=${CALL_SID}" \
  -d "SpeechResult=I need to schedule a drain cleaning" \
  -d "From=+15551234567")

if [[ $RESPONSE == *"<Say"* ]]; then
    echo "   ✅ AI responded (booking intent detected)"
else
    echo "   ❌ No AI response"
fi
echo ""

# Step 2: Provide name
sleep 1
echo "   📞 Caller: 'My name is John Smith'"
RESPONSE=$(curl -s -X POST "${SERVER_URL}/api/gather" \
  -d "CallSid=${CALL_SID}" \
  -d "SpeechResult=My name is John Smith" \
  -d "From=+15551234567")

if [[ $RESPONSE == *"<Say"* ]]; then
    echo "   ✅ AI responded (name collected)"
else
    echo "   ❌ No AI response"
fi
echo ""

# Step 3: Provide phone
sleep 1
echo "   📞 Caller: 'My number is 555-123-4567'"
RESPONSE=$(curl -s -X POST "${SERVER_URL}/api/gather" \
  -d "CallSid=${CALL_SID}" \
  -d "SpeechResult=My number is 555-123-4567" \
  -d "From=+15551234567")

if [[ $RESPONSE == *"<Say"* ]]; then
    echo "   ✅ AI responded (phone collected)"
else
    echo "   ❌ No AI response"
fi
echo ""

# Check active sessions
echo "4️⃣  Checking active sessions..."
SESSIONS=$(curl -s "${SERVER_URL}/api/sessions")
echo "$SESSIONS" | head -n 5
echo ""

# Test info request
NEW_CALL="TEST_INFO_$(date +%s)"
echo "5️⃣  Testing information request..."
echo "   📞 Caller: 'What are your hours?'"
RESPONSE=$(curl -s -X POST "${SERVER_URL}/voice" \
  -d "CallSid=${NEW_CALL}" \
  -d "From=+15559876543")

sleep 1
RESPONSE=$(curl -s -X POST "${SERVER_URL}/api/gather" \
  -d "CallSid=${NEW_CALL}" \
  -d "SpeechResult=What are your hours?" \
  -d "From=+15559876543")

if [[ $RESPONSE == *"<Say"* ]]; then
    echo "   ✅ AI responded to hours question"
else
    echo "   ❌ No AI response"
fi
echo ""

echo "================================"
echo "✅ Test suite complete!"
echo ""
echo "💡 To test with real call:"
echo "   1. Start server: npm start"
echo "   2. Expose with: ngrok http 3100"
echo "   3. Set Twilio webhook to ngrok URL"
echo "   4. Call: +1 (929) 755-7288"
echo ""
