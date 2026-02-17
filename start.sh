#!/bin/bash

# Quick start script for AI Receptionist

cd "$(dirname "$0")"

echo "🚀 Starting AI Receptionist for Mike's Plumbing NYC"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from Keychain..."
    cat > .env << EOF
TWILIO_ACCOUNT_SID=$(security find-generic-password -a clawdbot -s twilio-account-sid -w)
TWILIO_AUTH_TOKEN=$(security find-generic-password -a clawdbot -s twilio-auth-token -w)
TWILIO_PHONE_NUMBER=+19297557288
ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY
PORT=3000
EOF
    echo "✅ .env created. Please set ANTHROPIC_API_KEY"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start server
echo "🎙️  Server will be available at: http://localhost:3000"
echo "💡 Expose with: ngrok http 3000"
echo ""
npm start
