# Supabase Project URL and Anon Key
PROJECT_REF="qftuhnkzyegcxfozdfyz"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/create-creator-profile"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8"

echo "Testing create-creator-profile with RANDOM user_id..."

curl -i -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "0dfc5db4-2890-479c-886e-43a0875cc811",
    "email": "testrepro1770446575797@gmail.com",
    "brand_name": "Test Curl Brand",
    "phone": "0811111111",
    "social_media": {
        "instagram": "test_ig"
    }
  }'
