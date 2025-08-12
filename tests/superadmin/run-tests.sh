#!/bin/bash

# SuperAdmin Test Suite Runner
# This script provides an easy way to run the comprehensive test suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${TEST_BASE_URL:-"http://localhost:3000"}
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🎯 SuperAdmin Comprehensive Test Suite${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js >= 16.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "npm $(npm -v) is installed"
}

# Check if dependencies are installed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not found. Installing..."
        npm install
    fi
    
    print_status "Dependencies are ready"
}

# Check if server is running
check_server() {
    print_info "Checking if server is running at $BASE_URL..."
    
    if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        print_status "Server is running and healthy"
    else
        print_error "Server is not running or not accessible at $BASE_URL"
        print_info "Please start your application server before running tests"
        exit 1
    fi
}

# Run specific test module
run_module_test() {
    local module=$1
    local test_file="$TEST_DIR/${module}.test.js"
    
    if [ ! -f "$test_file" ]; then
        print_error "Test file not found: $test_file"
        return 1
    fi
    
    print_info "Running $module tests..."
    npx mocha --timeout 30000 --reporter spec "$test_file"
}

# Run all tests
run_all_tests() {
    print_info "Running all SuperAdmin tests..."
    npx mocha --timeout 30000 --reporter spec "$TEST_DIR"/*.test.js
}

# Run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    npx mocha --timeout 30000 --reporter spec "$TEST_DIR/run-all-tests.js"
}

# Run tests with coverage
run_coverage_tests() {
    print_info "Running tests with coverage..."
    npx nyc mocha --timeout 30000 --reporter spec "$TEST_DIR"/*.test.js
}

# Show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  all              Run all tests"
    echo "  auth             Run authentication tests only"
    echo "  roles            Run roles management tests only"
    echo "  tenants          Run tenants management tests only"
    echo "  users            Run users management tests only"
    echo "  audit-logs       Run audit logs tests only"
    echo "  dashboard        Run dashboard tests only"
    echo "  integration      Run integration tests only"
    echo "  coverage         Run tests with coverage"
    echo "  help             Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  TEST_BASE_URL    Base URL for testing (default: http://localhost:3000)"
    echo ""
    echo "Examples:"
    echo "  $0 all                    # Run all tests"
    echo "  $0 auth                   # Run authentication tests only"
    echo "  TEST_BASE_URL=http://localhost:3001 $0 all  # Use custom base URL"
}

# Main execution
main() {
    local command=${1:-"all"}
    
    echo -e "${BLUE}🚀 Starting SuperAdmin Test Suite${NC}"
    echo -e "${BLUE}📍 Testing against: $BASE_URL${NC}"
    echo ""
    
    # Pre-flight checks
    check_node
    check_npm
    check_dependencies
    check_server
    
    echo ""
    
    # Run tests based on command
    case $command in
        "all")
            run_all_tests
            ;;
        "auth")
            run_module_test "auth"
            ;;
        "roles")
            run_module_test "roles"
            ;;
        "tenants")
            run_module_test "tenants"
            ;;
        "users")
            run_module_test "users"
            ;;
        "audit-logs")
            run_module_test "audit-logs"
            ;;
        "dashboard")
            run_module_test "dashboard"
            ;;
        "integration")
            run_integration_tests
            ;;
        "coverage")
            run_coverage_tests
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Test suite completed!"
}

# Run main function with all arguments
main "$@"
