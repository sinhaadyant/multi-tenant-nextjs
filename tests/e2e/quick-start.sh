#!/bin/bash

# Multi-Tenant Next.js E2E Tests - Quick Start Script

echo "🚀 Multi-Tenant Next.js E2E Tests - Quick Start"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if we're in the right directory (main project or e2e directory)
if [ ! -f "package.json" ] && [ ! -f "../package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root or tests/e2e directory"
    exit 1
fi

# If we're in e2e directory, go to project root
if [ -f "../package.json" ]; then
    cd ..
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if the application is running
echo "🔍 Checking if application is running on http://localhost:3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running on http://localhost:3000"
else
    echo "⚠️  Application is not running on http://localhost:3000"
    echo "   Please start your Next.js application with: npm run dev"
    echo "   Then run this script again"
    exit 1
fi

# Show available options
echo ""
echo "🧪 Available Test Options:"
echo "1. Run all tests"
echo "2. Run dashboard tests only"
echo "3. Run user management tests only"
echo "4. Run audit logs tests only"
echo "5. Run notifications tests only"
echo "6. Run support system tests only"
echo "7. Run tests in headless mode (CI/CD)"
echo "8. Show help"
echo "9. Exit"
echo ""

read -p "Enter your choice (1-9): " choice

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
        echo "🧪 Running all tests in headless mode..."
        HEADLESS=true node tests/e2e/run-all-tests.js
        ;;
    8)
        echo "📖 Showing help..."
        node tests/e2e/run-all-tests.js --help
        ;;
    9)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and select 1-9"
        exit 1
        ;;
esac

echo ""
echo "📊 Test execution completed!"
echo "📁 Check the generated JSON reports for detailed results"
echo "📸 Screenshots (if any) are saved in the test-screenshots/ directory" 