#!/bin/bash

# Calva AI Receptionist - Edge TTS Installation Script
# This script installs Edge TTS for high-quality voice synthesis

echo "🎙️  Installing Edge TTS for Calva AI Receptionist"
echo "=================================================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "   Please install Python 3.7 or higher first:"
    echo "   - macOS: brew install python3"
    echo "   - Ubuntu: sudo apt install python3 python3-pip"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if pip3 is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ Error: pip3 is not installed"
    echo "   Install pip3 with: sudo apt install python3-pip"
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"
echo ""

# Install edge-tts
echo "📦 Installing edge-tts..."
pip3 install edge-tts --upgrade

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ edge-tts installed successfully!"
    echo ""
    
    # Verify installation
    if command -v edge-tts &> /dev/null; then
        echo "✅ Verification: $(edge-tts --version)"
        echo ""
        echo "🎉 Installation complete!"
        echo ""
        echo "Next steps:"
        echo "1. Start your Calva server: npm run dev"
        echo "2. Edge TTS will automatically be used for voice responses"
        echo "3. Check logs to confirm TTS is working"
        echo ""
        echo "Test Edge TTS:"
        echo "  edge-tts --text 'Hello, this is Calva AI' --write-media test.mp3"
        echo "  afplay test.mp3  # macOS"
        echo ""
    else
        echo "⚠️  Warning: edge-tts command not found in PATH"
        echo "   Try adding to PATH or reinstall with: pip3 install --user edge-tts"
        echo ""
        echo "   Your PATH: $PATH"
    fi
else
    echo ""
    echo "❌ Installation failed!"
    echo "   Try manually: pip3 install edge-tts"
    exit 1
fi
