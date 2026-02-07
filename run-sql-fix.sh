#!/bin/bash

# Script to run the SQL fix via Supabase CLI
# This uses the local Supabase connection

echo "Running SQL migration to fix auth trigger..."

npx supabase db execute --file fix-auth-trigger.sql --project-ref qftuhnkzyegcxfozdfyz

echo "Done! Try registering again."
