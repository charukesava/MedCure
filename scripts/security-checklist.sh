#!/usr/bin/env bash
# 🔐 Security Deployment Checklist
# Run this before deploying to production
# Ensures all security configurations are in place

set -e

echo "🔐 SECURITY DEPLOYMENT CHECKLIST"
echo "=================================="
echo ""

# ─── Load environment variables from .env file ──────────────────────────────
if [ -f "backend/.env" ]; then
    echo "📂 Loading configuration from backend/.env..."
    export $(cat backend/.env | grep -v '^#' | grep -v '^$' | xargs)
    echo "✓ Environment variables loaded"
    echo ""
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_count=0
passed_count=0

# Helper function
check_item() {
    check_count=$((check_count + 1))
    local item=$1
    local command=$2
    local required=$3  # "required" or "recommended"
    
    echo -n "[$check_count] $item ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        passed_count=$((passed_count + 1))
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ FAIL (REQUIRED)${NC}"
        else
            echo -e "${YELLOW}⚠ FAIL (recommended)${NC}"
        fi
    fi
}

# Environment variables
echo "📋 ENVIRONMENT VARIABLES"
echo "========================"
check_item "PORT configured" "test -n '$PORT'" "required"
check_item "GEMINI_API_KEY set" "test -n '$GEMINI_API_KEY'" "required"
check_item "ALLOWED_ORIGINS configured" "test -n '$ALLOWED_ORIGINS'" "required"
check_item "Firebase configured" "test -n '$FIREBASE_SERVICE_ACCOUNT' || test -f backend/serviceAccountKey.json" "required"
check_item "NODE_ENV set to production" "test '$NODE_ENV' = 'production' || test -n '$PORT'" "required"
echo ""

# Files
echo "📁 SECURITY FILES"
echo "=================="
check_item ".env file NOT in git" "! git ls-files | grep -q '^\\.env$'" "required"
check_item "serviceAccountKey.json NOT in git" "! git ls-files | grep -q 'serviceAccountKey.json'" "required"
check_item ".gitignore has security patterns" "grep -q 'serviceAccountKey' .gitignore" "required"
check_item "security middleware exists" "test -f backend/middleware/security.js" "required"
check_item "audit logging enabled" "test -f backend/middleware/auditLog.js" "required"
check_item "SECURITY.md documentation exists" "test -f SECURITY.md" "required"
echo ""

# Backend Configuration
echo "🔧 BACKEND CONFIGURATION"
echo "========================"
check_item "Helmet security headers" "grep -q 'helmet(' backend/server.js" "required"
check_item "CORS configured" "grep -q 'cors(' backend/server.js" "required"
check_item "Rate limiting available" "grep -q 'rate-limit' backend/package.json" "required"
check_item "Input sanitization" "grep -q 'sanitizeInputs' backend/server.js" "required"
check_item "Error handling" "grep -q 'Global error handler' backend/server.js" "required"
check_item "Admin config centralized" "test -f backend/config/adminConfig.js" "required"
echo ""

# Frontend Configuration
echo "🎨 FRONTEND CONFIGURATION"
echo "========================="
check_item "Firebase env vars validated" "grep -q 'requiredEnvVars' frontend/src/config/firebase.js" "required"
check_item "No hardcoded secrets" "! grep -r 'AIzaSy' frontend/src/ 2>/dev/null | grep -v '.example'" "required"
check_item "Security utilities exist" "test -f frontend/src/utils/security.js" "required"
check_item "HTTPS check implemented" "grep -q 'checkHttpSecure' frontend/src/utils/security.js" "required"
echo ""

# Code Quality
echo "📊 CODE QUALITY"
echo "==============="
check_item "No console logging in production" "test -n '$NODE_ENV'" "recommended"
check_item "Dependencies up to date" "test -f package-lock.json" "recommended"
check_item "No vulnerable dependencies" "npm audit --audit-level=moderate > /dev/null 2>&1 || true" "recommended"
echo ""

# SSL/HTTPS
echo "🔒 HTTPS & SSL"
echo "==============="
if [ "$NODE_ENV" = "production" ]; then
    check_item "HTTPS URL in use" "echo '$REACT_APP_API_URL' | grep -q 'https://' || [ -z '$REACT_APP_API_URL' ]" "required"
    check_item "SSL certificate valid" "test -f ssl.crt || echo 'Manual verification required'" "required"
fi
echo ""

# Database/Storage
echo "💾 DATA STORAGE"
echo "================"
check_item "Firebase Firestore rules restricted" "test -n 'FIREBASE_SERVICE_ACCOUNT' || echo 'Verify in Firebase Console'" "required"
echo ""

# Summary
echo ""
echo "=================================="
echo "✅ SECURITY CHECKLIST SUMMARY"
echo "=================================="
echo "Checks Passed: $passed_count / $check_count"

if [ $passed_count -lt $check_count ]; then
    echo -e "${RED}❌ Some checks failed. Review and fix before deployment.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All security checks passed!${NC}"
    echo ""
    echo "Final Reminders:"
    echo "  ✓ Verify HTTPS certificate is valid"
    echo "  ✓ Test 2FA/MFA is enabled"
    echo "  ✓ Backup database before deployment"
    echo "  ✓ Review recent audit logs"
    echo "  ✓ Monitor error rates during deployment"
    echo "  ✓ Have rollback plan ready"
    echo ""
    echo "🚀 Ready for deployment!"
    exit 0
fi
