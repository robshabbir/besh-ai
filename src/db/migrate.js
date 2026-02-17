const fs = require('fs');
const path = require('path');
const db = require('./index');

/**
 * Run database migrations
 */
function migrate() {
  console.log('🔄 Running database migrations...');
  
  db.init();
  
  // Run base schema first
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  statements.forEach(statement => {
    try {
      db.getDb().prepare(statement).run();
    } catch (error) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  });
  
  // Run additional migrations from migrations/ directory
  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in order
    
    migrationFiles.forEach(file => {
      console.log(`  Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migration = fs.readFileSync(migrationPath, 'utf8');
      
      const migrationStatements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      migrationStatements.forEach(statement => {
        try {
          db.getDb().prepare(statement).run();
        } catch (error) {
          // Ignore "already exists" and "duplicate column" errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate column')) {
            console.error(`  ⚠️  Error in ${file}:`, error.message);
          }
        }
      });
    });
  }
  
  console.log('✅ Database migrations complete');
}

// Run if called directly
if (require.main === module) {
  try {
    migrate();
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

module.exports = { migrate };
