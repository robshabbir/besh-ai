#!/bin/bash
# Watches for cloudflared tunnel URL changes and updates Twilio + .env
# Run via cron every 5 minutes or as a launchd agent

LOGFILE="/tmp/calva-tunnel.err.log"
ENVFILE="/Users/rifat/clawd/revenue/ai-receptionist/.env"
STATE_FILE="/tmp/calva-tunnel-url.txt"

TWILIO_SID="***REDACTED_TWILIO_ACCOUNT_SID***"
TWILIO_TOKEN="***REDACTED_TWILIO_AUTH_TOKEN***"
PHONE_SID="PN161105a437ccabe3200a6a22d9b10ac9"

# Get current tunnel URL
CURRENT_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOGFILE" 2>/dev/null | tail -1)
LAST_URL=$(cat "$STATE_FILE" 2>/dev/null)

if [ -z "$CURRENT_URL" ]; then
  echo "$(date): No tunnel URL found" >> /tmp/calva-sync.log
  exit 0
fi

if [ "$CURRENT_URL" = "$LAST_URL" ]; then
  exit 0  # No change
fi

echo "$(date): URL changed: $LAST_URL -> $CURRENT_URL" >> /tmp/calva-sync.log

# Update .env
sed -i '' "s|^BASE_URL=.*|BASE_URL=$CURRENT_URL|" "$ENVFILE"

# Update Twilio
curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/IncomingPhoneNumbers/$PHONE_SID.json" \
  -u "$TWILIO_SID:$TWILIO_TOKEN" \
  --data-urlencode "VoiceUrl=${CURRENT_URL}/api/voice-cr" \
  --data-urlencode "VoiceMethod=POST" \
  --data-urlencode "StatusCallback=${CURRENT_URL}/api/status" \
  --data-urlencode "StatusCallbackMethod=POST" > /dev/null 2>&1

# Save state
echo "$CURRENT_URL" > "$STATE_FILE"
echo "$(date): Twilio updated to $CURRENT_URL" >> /tmp/calva-sync.log
