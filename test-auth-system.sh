#!/bin/bash

# 🧪 Quick Authentication System Test Script

echo "🔍 Authentication System Health Check"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "\n1. Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server is running on http://localhost:3000"
else
    echo -e "${RED}✗${NC} Server is not running! Please start with: npm run dev"
    exit 1
fi

# Test signin endpoint
echo -e "\n2. Testing signin API endpoint..."
SIGNIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":""}')

if [ "$SIGNIN_RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓${NC} Signin endpoint responding correctly (validation errors)"
elif [ "$SIGNIN_RESPONSE" == "405" ]; then
    echo -e "${YELLOW}⚠${NC} Method not allowed - check API route setup"
elif [ "$SIGNIN_RESPONSE" == "404" ]; then
    echo -e "${RED}✗${NC} Signin endpoint not found!"
else
    echo -e "${YELLOW}⚠${NC} Unexpected response: $SIGNIN_RESPONSE"
fi

# Test NextAuth session endpoint
echo -e "\n3. Testing NextAuth session endpoint..."
SESSION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session)

if [ "$SESSION_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓${NC} NextAuth session endpoint working"
else
    echo -e "${RED}✗${NC} NextAuth session endpoint error: $SESSION_RESPONSE"
fi

# Test rate limiting (multiple requests)
echo -e "\n4. Testing rate limiting..."
echo "Sending 6 invalid login attempts..."

for i in {1..6}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"wrongpassword"}')
    
    if [ "$RESPONSE" == "429" ]; then
        echo -e "${GREEN}✓${NC} Rate limiting activated on attempt $i"
        break
    elif [ "$RESPONSE" == "400" ]; then
        echo -e "  Attempt $i: $RESPONSE (normal validation error)"
    else
        echo -e "  Attempt $i: $RESPONSE"
    fi
done

# Check test page accessibility
echo -e "\n5. Testing auth-test page..."
AUTH_TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth-test)

if [ "$AUTH_TEST_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓${NC} Auth test page accessible"
else
    echo -e "${RED}✗${NC} Auth test page error: $AUTH_TEST_RESPONSE"
fi

echo -e "\n🎯 Test Summary:"
echo "=================="
echo -e "• Visit ${GREEN}http://localhost:3000/auth-test${NC} to run interactive tests"
echo -e "• Check browser console for client-side errors"
echo -e "• Test actual login with your user credentials"
echo -e "• Monitor Redux DevTools for state changes"

echo -e "\n📊 Database Check:"
echo "=================="
echo -e "• Verify database connection in your app"
echo -e "• Check if users table exists with required fields"
echo -e "• Ensure passwords are hashed with bcrypt"
echo -e "• Test permissions field format (JSON array)"

echo -e "\n🔧 Environment Variables:"
echo "=========================="
echo -e "Required variables:"
echo -e "• AUTH_SECRET (for JWT signing)"
echo -e "• DATABASE_URL (database connection)"
echo -e "• NEXT_PUBLIC_SITE_URL (for API calls)"

echo -e "\n${GREEN}Test completed!${NC} Review results above."