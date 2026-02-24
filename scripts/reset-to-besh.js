#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../src/db');

const TABLES = [
  'calva_notifications',
  'calva_bookings',
  'calva_voicemails',
  'calva_calls',
  'calva_users',
  'calva_tenants'
];

async function backupTable(supabase, table, outDir) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw new Error(`${table} backup failed: ${error.message}`);
  const outPath = path.join(outDir, `${table}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data || [], null, 2));
  return (data || []).length;
}

async function clearTable(supabase, table) {
  // Delete all rows with a broad filter to satisfy PostgREST safety checks.
  const { error } = await supabase.from(table).delete().not('id', 'is', null);
  if (error && !error.message.includes('No rows found')) {
    throw new Error(`${table} clear failed: ${error.message}`);
  }
}

(async () => {
  const supabase = db.init();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'archive', `pre-besh-reset-${ts}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log('📦 Backing up legacy Calva tables...');
  for (const table of TABLES) {
    const count = await backupTable(supabase, table, outDir);
    console.log(`  - ${table}: ${count} rows backed up`);
  }

  console.log('🧹 Clearing legacy Calva rows...');
  for (const table of TABLES) {
    await clearTable(supabase, table);
    console.log(`  - ${table}: cleared`);
  }

  console.log('✅ Reset complete. Backups saved to:');
  console.log(`   ${outDir}`);
})().catch((err) => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
