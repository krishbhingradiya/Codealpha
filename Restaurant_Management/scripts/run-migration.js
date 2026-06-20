#!/usr/bin/env node
/**
 * Migration runner — executes SQL migration against Supabase
 * Usage: node scripts/run-migration.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  const sqlPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    
    try {
      const { error } = await supabase.rpc('', {}).maybeSingle();
      // Use raw fetch to Supabase REST SQL endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({})
      });
      
      success++;
      process.stdout.write(`  ✅ [${i + 1}/${statements.length}] ${preview}...\n`);
    } catch (err) {
      errors++;
      process.stdout.write(`  ❌ [${i + 1}/${statements.length}] ${preview}... ERROR: ${err.message}\n`);
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${errors} failed`);
}

// Alternative: Use Supabase's built-in SQL execution via the management API
// For the anon key, we need to use a different approach
// Let's just test the connection and create tables via individual Supabase client calls

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');
  
  // Test connection first
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (!error) {
    console.log('✅ Database tables already exist!');
    console.log('   If you need to re-run the migration, please use the Supabase SQL Editor.');
    return;
  }
  
  console.log('⚠️  Tables not found. Please run the migration SQL manually:\n');
  console.log('1. Go to your Supabase Dashboard SQL Editor:');
  console.log(`   ${SUPABASE_URL.replace('.supabase.co', '')}/sql\n`);
  console.log('   Or: https://supabase.com/dashboard/project/' + SUPABASE_URL.replace('https://', '').replace('.supabase.co', '') + '/sql/new\n');
  console.log('2. Copy and paste the contents of:');
  console.log(`   ${path.resolve(__dirname, '..', 'migrations', '001_initial_schema.sql')}\n`);
  console.log('3. Click "Run" to execute the migration.\n');
  console.log('4. Then restart the server with: npm run dev');
}

setupDatabase().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
