#!/bin/bash
# Migration Runner Script for Observatory Database
# Usage: ./migrate.sh [supabase|local] [database_url]

set -e

MIGRATION_DIR="supabase/migrations"
MODE=${1:-supabase}

if [ "$MODE" = "supabase" ]; then
    echo "⚠️  Supabase migrations should be run via Supabase Dashboard SQL Editor"
    echo "Run migrations in order:"
    echo "  1. 001_initial_schema.sql"
    echo "  2. 002_indexes.sql"
    echo "  3. 003_triggers_and_functions.sql"
    echo "  4. 004_rls_policies.sql"
    echo ""
    echo "Optional: seed.sql for sample data"
    exit 0
fi

if [ "$MODE" = "local" ]; then
    DB_URL=${2:-"postgresql://postgres:postgres@localhost:5432/observatory"}
    
    echo "Running migrations against local PostgreSQL..."
    echo "Database: $DB_URL"
    echo ""
    
    for migration in 001_initial_schema.sql 002_indexes.sql 003_triggers_and_functions.sql 004_rls_policies.sql; do
        echo "Running $migration..."
        psql "$DB_URL" -f "$MIGRATION_DIR/$migration"
    done
    
    echo ""
    read -p "Run seed data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running seed.sql..."
        psql "$DB_URL" -f "supabase/seed.sql"
    fi
    
    echo "✅ Migrations completed!"
else
    echo "Usage: ./migrate.sh [supabase|local] [database_url]"
    exit 1
fi

