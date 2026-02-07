#!/bin/bash

# Configuration
FUNCTION_URL="https://qftuhnkzyegcxfozdfyz.supabase.co/functions/v1/send-otp"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8"

# Test POST with user_id
echo "Testing POST request with user_id..."
curl -i -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test_curl_uid@example.com", "user_id": "00000000-0000-0000-0000-000000000000"}'
