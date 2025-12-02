import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.server' });

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json());

// Session Pooler connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 as ok');
    res.json({ connected: true, ok: rows[0].ok === 1 });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employees ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'INSERT INTO employees (id, name, gender, workshop_id, department, position, join_date, standard_base_score, status, phone, expected_daily_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [req.body.id, req.body.name, req.body.gender, req.body.workshopId, req.body.department, req.body.position, req.body.joinDate, req.body.standardBaseScore, req.body.status, req.body.phone, req.body.expectedDailyHours]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE employees SET name=$2, gender=$3, workshop_id=$4, department=$5, position=$6, join_date=$7, standard_base_score=$8, status=$9, phone=$10, expected_daily_hours=$11 WHERE id=$1 RETURNING *',
      [req.params.id, req.body.name, req.body.gender, req.body.workshopId, req.body.department, req.body.position, req.body.joinDate, req.body.standardBaseScore, req.body.status, req.body.phone, req.body.expectedDailyHours]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workshops
app.get('/api/workshops', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM workshops ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM settings WHERE id = $1', ['global']);
    res.json(rows[0] || { announcement: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'INSERT INTO settings (id, announcement) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET announcement = $2 RETURNING *',
      ['global', req.body.announcement]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System Users
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM system_users ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const {
      id,
      username,
      displayName,
      role,
      customRoleName,
      pinCode,
      isSystem = false,
      scopes = [],
      permissions = []
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO system_users
        (id, username, display_name, role, custom_role_name, pin_code, is_system, scopes, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
       RETURNING *`,
      [
        id,
        username,
        displayName,
        role,
        customRoleName || null,
        pinCode,
        isSystem,
        JSON.stringify(scopes),
        JSON.stringify(permissions)
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const {
      username,
      displayName,
      role,
      customRoleName,
      pinCode,
      isSystem = false,
      scopes = [],
      permissions = []
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE system_users SET
        username = $2,
        display_name = $3,
        role = $4,
        custom_role_name = $5,
        pin_code = $6,
        is_system = $7,
        scopes = $8::jsonb,
        permissions = $9::jsonb
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        username,
        displayName,
        role,
        customRoleName || null,
        pinCode,
        isSystem,
        JSON.stringify(scopes),
        JSON.stringify(permissions)
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM system_users WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly Data
app.get('/api/monthly-data/:year/:month', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM monthly_data WHERE year = $1 AND month = $2',
      [req.params.year, req.params.month]
    );
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/monthly-data', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'INSERT INTO monthly_data (year, month, data) VALUES ($1, $2, $3) ON CONFLICT (year, month) DO UPDATE SET data = $3 RETURNING *',
      [req.body.year, req.body.month, JSON.stringify(req.body.data)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
});
