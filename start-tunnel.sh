#!/bin/bash
# Calva tunnel - keeps cloudflared running and updates .env with the URL
# Run: nohup bash start-tunnel.sh &

LOGFILE="/tmp/cloudflared-calva.log"
ENVFILE="/Users/rifat/clawd/revenue/ai-receptionist/.env"

while true; do
  echo "$(date): Starting cloudflared tunnel..." >> "$LOGFILE"
  
  # Start tunnel and capture output
  cloudflared tunnel --url http://localhost:3100 --no-autoupdate 2>&1 | tee -a "$LOGFILE" &
  CF_PID=$!
  
  # Wait for URL to appear
  sleep 8
  NEW_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOGFILE" | tail -1)
  
  if [ -n "$NEW_URL" ]; then
    echo "$(date): Tunnel URL: $NEW_URL" >> "$LOGFILE"
    # Update .env BASE_URL
    sed -i '' "s|^BASE_URL=.*|BASE_URL=$NEW_URL|" "$ENVFILE"
  fi
  
  # Wait for process to die
  wait $CF_PID
  echo "$(date): Tunnel died, restarting in 5s..." >> "$LOGFILE"
  sleep 5
done
