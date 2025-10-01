import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Connecting to database...');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix-verification-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔄 Running migration to fix verification_tokens table...');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('\nTable structure:');

    // Show the current table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'verification_tokens'
      ORDER BY ordinal_position;
    `);

    console.table(result.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
