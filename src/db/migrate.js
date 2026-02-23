const db = require('./index');

/**
 * Run database migrations (Supabase)
 * Tables are managed via Supabase dashboard/migrations.
 * This just verifies connectivity.
 */
async function migrate() {
  console.log('🔄 Verifying Supabase connection...');
  const supabase = db.init();
  
  // Quick connectivity check
  const { data, error } = await supabase.from('calva_tenants').select('id').limit(1);
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
  
  console.log('✅ Supabase connected — tables ready');
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { migrate };
