#!/bin/bash

# Test script for WhatsApp CTA feature
# Usage: ./test-whatsapp-cta.sh <PROFILE_ID> <AUTH_TOKEN>

PROFILE_ID="${1:-your-profile-id}"
AUTH_TOKEN="${2:-your-auth-token}"
API_URL="http://localhost:5300/api/profiles"

echo "🧪 Testing WhatsApp CTA Feature"
echo "================================"
echo ""

# Test 1: Enable WhatsApp CTA
echo "📝 Test 1: Enable WhatsApp CTA"
curl -X PATCH \
  "${API_URL}/${PROFILE_ID}/features-config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "whatsappCta": {
      "enabled": true,
      "buttonText": "¡Contáctame por WhatsApp!"
    }
  }' | jq '.'

echo ""
echo ""

# Test 2: Disable WhatsApp CTA
echo "📝 Test 2: Disable WhatsApp CTA"
curl -X PATCH \
  "${API_URL}/${PROFILE_ID}/features-config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "whatsappCta": {
      "enabled": false,
      "buttonText": "Escríbeme por WhatsApp"
    }
  }' | jq '.'

echo ""
echo ""

# Test 3: Update multiple features at once
echo "📝 Test 3: Update multiple features"
curl -X PATCH \
  "${API_URL}/${PROFILE_ID}/features-config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "healthSurvey": {
      "enabled": true,
      "buttonText": "Completa tu encuesta"
    },
    "tuHistoria": {
      "enabled": true,
      "buttonText": "Lee mi historia"
    },
    "whatsappCta": {
      "enabled": true,
      "buttonText": "Escríbeme ahora"
    }
  }' | jq '.'

echo ""
echo ""

# Test 4: Verify profile
echo "📝 Test 4: Get profile to verify changes"
curl -X GET \
  "${API_URL}/${PROFILE_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  | jq '.featuresConfig'

echo ""
echo "✅ Tests completed!"
