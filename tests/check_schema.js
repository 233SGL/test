
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.server' });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workshops';
    `);
        console.log('Workshops Table Schema:', res.rows);

        // Also check if there is any data
        const data = await pool.query('SELECT * FROM workshops LIMIT 1');
        console.log('Sample Data:', data.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
