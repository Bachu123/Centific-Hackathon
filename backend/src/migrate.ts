import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env');
  console.error('   Add it from Supabase Dashboard → Settings → Database → Connection string (URI)');
  console.error('   Example: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         serial PRIMARY KEY,
        filename   text NOT NULL UNIQUE,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query('SELECT filename FROM _migrations ORDER BY filename');
    const appliedSet = new Set(applied.map((r: any) => r.filename));

    // Read all .sql migration files, sorted by name
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭  ${file} — already applied`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8').trim();

      if (!sql) {
        console.log(`⏭  ${file} — empty, skipping`);
        continue;
      }

      console.log(`▶  Running ${file} ...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ ${file} — success`);
        ranCount++;
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`❌ ${file} — FAILED: ${err.message}`);
        console.error('   Stopping migration. Fix the issue and re-run.');
        process.exit(1);
      }
    }

    console.log(`\n🎉 Done! ${ranCount} migration(s) applied, ${files.length - ranCount} skipped.`);
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
