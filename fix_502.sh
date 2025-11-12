#!/bin/bash

# Quick fix script for 502 Bad Gateway error on VPS
# Usage: ./fix_502.sh

set -e

echo "=========================================="
echo "Fixing 502 Bad Gateway Error"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from your project root."
    exit 1
fi

echo ""
echo "Step 1: Checking container status..."
docker-compose ps

echo ""
echo "Step 2: Checking backend logs for errors..."
if docker-compose logs --tail=20 backend | grep -i "error\|fatal\|exception" > /dev/null; then
    print_warning "Errors found in backend logs:"
    docker-compose logs --tail=20 backend | grep -i "error\|fatal\|exception"
else
    print_status "No critical errors in backend logs"
fi

echo ""
echo "Step 3: Checking if backend is responding..."
if docker-compose exec -T backend curl -f http://localhost:8000/ > /dev/null 2>&1; then
    print_status "Backend is responding"
else
    print_error "Backend is not responding"
    echo "Attempting to restart backend..."
    docker-compose restart backend
    sleep 5
fi

echo ""
echo "Step 4: Checking if frontend can reach backend..."
if docker-compose exec -T frontend wget -q -O- http://backend:8000/ > /dev/null 2>&1; then
    print_status "Frontend can reach backend"
else
    print_error "Frontend cannot reach backend"
    echo "Restarting frontend..."
    docker-compose restart frontend
    sleep 3
fi

echo ""
echo "Step 5: Checking database connection..."
if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    print_status "Database is ready"
else
    print_error "Database is not ready"
    echo "Restarting database..."
    docker-compose restart db
    sleep 10
fi

echo ""
echo "Step 6: Final status check..."
echo "--- Container Status ---"
docker-compose ps

echo ""
echo "--- Testing endpoints ---"
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    print_status "Frontend is accessible at http://localhost:3000"
else
    print_error "Frontend is not accessible"
fi

if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    print_status "Backend is accessible at http://localhost:8000"
else
    print_error "Backend is not accessible"
fi

echo ""
echo "=========================================="
echo "Fix attempt completed!"
echo "=========================================="
echo ""
echo "If the issue persists, try:"
echo "  1. docker-compose down && docker-compose up -d"
echo "  2. Check logs: docker-compose logs -f"
echo "  3. Review VPS_TROUBLESHOOTING.md for detailed steps"
echo ""

