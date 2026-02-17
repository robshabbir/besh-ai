#!/bin/bash

# ===================================
# Calva Landing Page - Local Test Server
# ===================================

echo "🚀 Starting Calva Landing Page local server..."
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found!"
    echo "   Please run this script from the landing-page directory:"
    echo "   cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/"
    echo "   ./test-local.sh"
    exit 1
fi

# Determine which server to use
PORT=8080

if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3 HTTP server"
    echo "📍 Server running at: http://localhost:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "✅ Using Python 2 HTTP server"
    echo "📍 Server running at: http://localhost:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer $PORT
elif command -v php &> /dev/null; then
    echo "✅ Using PHP built-in server"
    echo "📍 Server running at: http://localhost:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    php -S localhost:$PORT
elif command -v node &> /dev/null; then
    echo "✅ Using Node.js http-server"
    echo "📍 Installing http-server (one-time)..."
    npm install -g http-server 2>&1 | grep -v "npm WARN"
    echo "📍 Server running at: http://localhost:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    http-server -p $PORT
else
    echo "❌ No suitable HTTP server found!"
    echo ""
    echo "Please install one of the following:"
    echo "  • Python 3:  brew install python3"
    echo "  • PHP:       brew install php"
    echo "  • Node.js:   brew install node"
    echo ""
    echo "Or manually open index.html in your browser"
    exit 1
fi
