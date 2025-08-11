#!/bin/bash

echo "🚀 E2E Test Suite Quick Start"
echo "============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ -f "../package.json" ]; then
    echo "📁 Moving to project root directory..."
    cd ..
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found package.json"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies are already installed"
fi

# Check if the application is running
echo "🔍 Checking if the application is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running on http://localhost:3000"
else
    echo "⚠️ Application is not running. Starting it in the background..."
    npm run dev &
    sleep 10
    
    # Check again
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Application started successfully"
    else
        echo "❌ Failed to start application. Please start it manually with 'npm run dev'"
        exit 1
    fi
fi

echo ""
echo "🧪 Choose a test suite to run:"
echo "1) Run all tests"
echo "2) Run dashboard tests"
echo "3) Run user management tests"
echo "4) Run audit logs tests"
echo "5) Run notifications tests"
echo "6) Run support system tests"
echo "7) Run comprehensive tenant tests (all modules + edge cases)"
echo "8) Run enhanced comprehensive tests (CRUD + DB verification + immediate updates)"
echo "9) Run SuperAdmin comprehensive tests (authentication + dashboard + tenant management + cross-verification)"
echo "10) Exit"

read -p "Enter your choice (1-10): " choice

case $choice in
    1)
        echo "🧪 Running all tests..."
        node tests/e2e/run-all-tests.js
        ;;
    2)
        echo "🧪 Running dashboard tests..."
        node tests/e2e/run-all-tests.js dashboard
        ;;
    3)
        echo "🧪 Running user management tests..."
        node tests/e2e/run-all-tests.js user-management
        ;;
    4)
        echo "🧪 Running audit logs tests..."
        node tests/e2e/run-all-tests.js audit-logs
        ;;
    5)
        echo "🧪 Running notifications tests..."
        node tests/e2e/run-all-tests.js notifications
        ;;
    6)
        echo "🧪 Running support system tests..."
        node tests/e2e/run-all-tests.js support-system
        ;;
    7)
        echo "🧪 Running comprehensive tenant tests..."
        node tests/e2e/run-all-tests.js comprehensive
        ;;
    8)
        echo "🧪 Running enhanced comprehensive tests..."
        node tests/e2e/run-all-tests.js enhanced
        ;;
    9)
        echo "🧪 Running SuperAdmin comprehensive tests..."
        node tests/e2e/run-all-tests.js superadmin
        ;;
    10)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Test execution completed!"
echo "📊 Check the generated JSON report files for detailed results." 