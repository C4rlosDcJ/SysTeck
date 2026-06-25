const pool = require('../config/database');

async function runAlter() {
  try {
    console.log('Connecting to database to alter sales table...');
    const connection = await pool.getConnection();
    try {
      console.log('Altering cashier_id column to be nullable...');
      await connection.query('ALTER TABLE sales MODIFY COLUMN cashier_id INT NULL');

      console.log('Adding pending status to sales status enum...');
      await connection.query("ALTER TABLE sales MODIFY COLUMN status ENUM('completed', 'cancelled', 'refunded', 'pending') DEFAULT 'completed'");

      console.log('Successfully altered sales table! ✅');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Alter table failed: ❌', error);
  } finally {
    await pool.end();
  }
}

runAlter();
