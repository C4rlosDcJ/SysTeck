const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const sqlPath = path.join(__dirname, '../../database/ecommerce_migration.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments
    sqlContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split queries by semicolon
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);

    console.log(`Found ${queries.length} queries to execute.`);

    const connection = await pool.getConnection();
    try {
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        
        // Skip USE statements to avoid overriding the connected database
        if (query.toUpperCase().startsWith('USE ')) {
          console.log(`Skipping query ${i + 1}/${queries.length} (${query}) as we are already connected.`);
          continue;
        }

        console.log(`Executing query ${i + 1}/${queries.length}...`);
        await connection.query(query);
      }
      console.log('Migration completed successfully! ✅');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Migration failed: ❌', error);
  } finally {
    // End pool so the process finishes
    await pool.end();
  }
}

runMigration();
