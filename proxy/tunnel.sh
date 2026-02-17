#!/bin/bash
# Serveo tunnel wrapper - auto-updates Vercel env when URL changes
PROXY_DIR="$(cd "$(dirname "$0")" && pwd)"
SAAS_DIR="$(dirname "$PROXY_DIR")"
LOG_FILE="/tmp/serveo-tunnel.log"
URL_FILE="/tmp/serveo-url.txt"

cd "$SAAS_DIR"

while true; do
  echo "[$(date)] Starting serveo tunnel..." >> "$LOG_FILE"

  # Start serveo and capture output
  ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -R selpix-proxy:80:localhost:4000 serveo.net 2>&1 | while IFS= read -r line; do
    echo "$line" >> "$LOG_FILE"

    # Extract URL from serveo output
    if echo "$line" | grep -q "Forwarding HTTP traffic from"; then
      URL=$(echo "$line" | grep -oP 'https://[^ ]+')
      if [ -n "$URL" ]; then
        echo "[$(date)] Tunnel URL: $URL" >> "$LOG_FILE"
        echo "$URL" > "$URL_FILE"

        # Update Vercel env var
        echo "[$(date)] Updating Vercel env COUPANG_PROXY_URL..." >> "$LOG_FILE"

        # Remove old value (ignore errors if doesn't exist)
        vercel env rm COUPANG_PROXY_URL production -y 2>/dev/null

        # Add new value
        echo "$URL" | vercel env add COUPANG_PROXY_URL production 2>> "$LOG_FILE"

        echo "[$(date)] Vercel env updated to: $URL" >> "$LOG_FILE"
        echo "[$(date)] Triggering Vercel redeployment..." >> "$LOG_FILE"

        # Get last deployment URL and promote/redeploy
        vercel deploy --prod --yes 2>> "$LOG_FILE" &

        echo "[$(date)] Tunnel active at: $URL" >> "$LOG_FILE"
      fi
    fi
  done

  echo "[$(date)] Tunnel disconnected. Restarting in 5s..." >> "$LOG_FILE"
  sleep 5
done
