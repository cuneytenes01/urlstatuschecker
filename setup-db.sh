#!/bin/bash

# This script helps set up the database
# Run this in Supabase SQL Editor or via API

echo "=== Supabase Database Setup ==="
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/sql/new"
echo ""
echo "2. Copy the content of: supabase/migrations/20250608000000_create_url_monitoring_tables.sql"
echo ""
echo "3. Paste it into the SQL Editor and click 'Run'"
echo ""
echo "4. Verify tables were created by running:"
echo "   SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
echo ""
echo "=== OR ==="
echo ""
echo "If you have the Supabase CLI installed locally:"
echo "   supabase db push"
echo ""
