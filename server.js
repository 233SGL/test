/**
 * ========================================
 * 鹤山积分管理系统 - 后端服务器
 * ========================================
 * 
 * 本模块提供 RESTful API 服务：
 * - 员工管理 API (CRUD)
 * - 系统用户管理 API
 * - 工段/车间管理 API
 * - 月度数据管理 API
 * - 系统设置 API
 * 
 * 数据库: Supabase PostgreSQL (通过 Session Pooler 连接)
 * 
 * @module server
 * @version 2.5
 */

import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

// 加载环境变量配置
dotenv.config({ path: '.env.server' });

const { Pool } = pg;
const app = express();

// 中间件配置
app.use(cors());        // 允许跨域请求
app.use(express.json()); // 解析 JSON 请求体

/**
 * 数据库连接池配置
 * 使用 Supabase Session Pooler 连接
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ========================================
// 健康检查 API
// ========================================

/**
 * GET /api/health
 * 检查数据库连接状态
 */
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 as ok');
    res.json({ connected: true, ok: rows[0].ok === 1 });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// ========================================
// 员工管理 API
// ========================================

/**
 * GET /api/employees
 * 获取所有员工列表
 */
app.get('/api/employees', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employees ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/employees
 * 创建新员工
 * @body {id, name, gender, workshopId, department, position, joinDate, standardBaseScore, status, phone, expectedDailyHours}
 */
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

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 工段/车间管理 API
// ========================================

/**
 * GET /api/workshops
 * 获取所有工段/车间列表
 */
app.get('/api/workshops', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM workshops ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 系统设置 API
// ========================================

/**
 * GET /api/settings
 * 获取全局设置（如公告内容）
 */
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

// ========================================
// 系统用户管理 API
// ========================================

/**
 * GET /api/users
 * 获取所有系统用户列表
 */
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

// ========================================
// 月度数据 API
// ========================================

/**
 * GET /api/monthly-data/:year/:month
 * 获取指定年月的月度数据
 */
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

// ========================================
// 织造工段员工管理 API
// ========================================

/**
 * GET /api/weaving/employees
 * 获取所有织造工段员工
 */
app.get('/api/weaving/employees', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM weaving_employees ORDER BY id');
    // 转换字段名为驼峰命名
    const employees = rows.map(row => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      position: row.position,
      baseSalary: parseFloat(row.base_salary) || 0,
      coefficient: parseFloat(row.coefficient) || 1.0,
      joinDate: row.join_date,
      phone: row.phone,
      status: row.status,
      notes: row.notes,
      attendanceDays: parseInt(row.attendance_days) || 0,
      machineId: row.machine_id,
      team: row.team
    }));
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weaving/employees
 * 创建织造工段员工
 */
app.post('/api/weaving/employees', async (req, res) => {
  try {
    const {
      id, name, gender, position, baseSalary, coefficient,
      joinDate, phone, status, notes, machineId, team
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO weaving_employees 
        (id, name, gender, position, base_salary, coefficient, join_date, phone, status, notes, machine_id, team)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [id, name, gender, position, baseSalary || 0, coefficient || 1.0, joinDate, phone, status || 'active', notes, machineId, team]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/weaving/employees/:id
 * 更新织造工段员工
 */
app.put('/api/weaving/employees/:id', async (req, res) => {
  try {
    const {
      name, gender, position, baseSalary, coefficient,
      joinDate, phone, status, notes, attendanceDays, machineId, team
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE weaving_employees SET
        name = $2, gender = $3, position = $4, base_salary = $5, coefficient = $6,
        join_date = $7, phone = $8, status = $9, notes = $10, attendance_days = $11,
        machine_id = $12, team = $13
       WHERE id = $1 RETURNING *`,
      [req.params.id, name, gender, position, baseSalary, coefficient, joinDate, phone, status, notes, attendanceDays, machineId, team]
    );
    if (!rows[0]) return res.status(404).json({ error: '员工不存在' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/weaving/employees/:id
 * 删除织造工段员工
 */
app.delete('/api/weaving/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM weaving_employees WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 织造工段机台管理 API
// ========================================

/**
 * GET /api/weaving/machines
 * 获取所有机台
 */
app.get('/api/weaving/machines', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM weaving_machines ORDER BY id');
    const machines = rows.map(row => ({
      id: row.id,
      name: row.name,
      speedType: row.speed_type,
      width: parseFloat(row.width),
      targetOutput: parseFloat(row.target_output),
      status: row.status
    }));
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/weaving/machines/:id
 * 更新机台信息
 */
app.put('/api/weaving/machines/:id', async (req, res) => {
  try {
    const { name, speedType, width, targetOutput, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE weaving_machines SET name = $2, speed_type = $3, width = $4, target_output = $5, status = $6 WHERE id = $1 RETURNING *`,
      [req.params.id, name, speedType, width, targetOutput, status]
    );
    if (!rows[0]) return res.status(404).json({ error: '机台不存在' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 织造工段配置 API
// ========================================

/**
 * GET /api/weaving/config
 * 获取织造工段配置
 */
app.get('/api/weaving/config', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM weaving_config WHERE id = $1', ['default']);
    if (!rows[0]) {
      return res.json({});
    }
    // 转换为驼峰命名
    const config = {
      netFormationBenchmark: parseFloat(rows[0].net_formation_benchmark),
      operationRateBenchmark: parseFloat(rows[0].operation_rate_benchmark),
      targetEquivalentOutput: parseFloat(rows[0].target_equivalent_output),
      operatorQuota: parseInt(rows[0].operator_quota),
      avgTargetBonus: parseFloat(rows[0].avg_target_bonus),
      adminTeamSize: parseInt(rows[0].admin_team_size),
      operationRateBonusUnit: parseFloat(rows[0].operation_rate_bonus_unit),
      leaderCoef: parseFloat(rows[0].leader_coef),
      memberCoef: parseFloat(rows[0].member_coef),
      leaderBaseSalary: parseFloat(rows[0].leader_base_salary),
      memberBaseSalary: parseFloat(rows[0].member_base_salary)
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/weaving/config
 * 更新织造工段配置
 */
app.put('/api/weaving/config', async (req, res) => {
  try {
    const {
      netFormationBenchmark, operationRateBenchmark, targetEquivalentOutput,
      operatorQuota, avgTargetBonus, adminTeamSize, operationRateBonusUnit,
      leaderCoef, memberCoef, leaderBaseSalary, memberBaseSalary
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO weaving_config 
        (id, net_formation_benchmark, operation_rate_benchmark, target_equivalent_output,
         operator_quota, avg_target_bonus, admin_team_size, operation_rate_bonus_unit,
         leader_coef, member_coef, leader_base_salary, member_base_salary)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         net_formation_benchmark = $1, operation_rate_benchmark = $2, target_equivalent_output = $3,
         operator_quota = $4, avg_target_bonus = $5, admin_team_size = $6, operation_rate_bonus_unit = $7,
         leader_coef = $8, member_coef = $9, leader_base_salary = $10, member_base_salary = $11,
         updated_at = NOW()
       RETURNING *`,
      [netFormationBenchmark, operationRateBenchmark, targetEquivalentOutput,
       operatorQuota, avgTargetBonus, adminTeamSize, operationRateBonusUnit,
       leaderCoef, memberCoef, leaderBaseSalary, memberBaseSalary]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 织造工段月度数据 API
// ========================================

/**
 * GET /api/weaving/monthly-data/:year/:month
 * 获取织造工段指定月份数据
 */
app.get('/api/weaving/monthly-data/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM weaving_monthly_data WHERE year = $1 AND month = $2',
      [year, month]
    );
    if (!rows[0]) {
      return res.json(null);
    }
    // 转换字段名
    const data = {
      year: rows[0].year,
      month: rows[0].month,
      netFormationRate: parseFloat(rows[0].net_formation_rate),
      operationRate: parseFloat(rows[0].operation_rate),
      equivalentOutput: parseFloat(rows[0].equivalent_output),
      activeMachines: parseInt(rows[0].active_machines),
      actualOperators: parseInt(rows[0].actual_operators),
      attendanceDays: parseInt(rows[0].attendance_days),
      calculationSnapshot: rows[0].calculation_snapshot,
      machineRecords: rows[0].machine_records
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weaving/monthly-data
 * 保存织造工段月度数据
 */
app.post('/api/weaving/monthly-data', async (req, res) => {
  try {
    const {
      year, month, netFormationRate, operationRate, equivalentOutput,
      activeMachines, actualOperators, attendanceDays, calculationSnapshot, machineRecords
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO weaving_monthly_data 
        (year, month, net_formation_rate, operation_rate, equivalent_output,
         active_machines, actual_operators, attendance_days, calculation_snapshot, machine_records)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)
       ON CONFLICT (year, month) DO UPDATE SET
         net_formation_rate = $3, operation_rate = $4, equivalent_output = $5,
         active_machines = $6, actual_operators = $7, attendance_days = $8,
         calculation_snapshot = $9::jsonb, machine_records = $10::jsonb,
         updated_at = NOW()
       RETURNING *`,
      [year, month, netFormationRate, operationRate, equivalentOutput,
       activeMachines, actualOperators, attendanceDays,
       JSON.stringify(calculationSnapshot), JSON.stringify(machineRecords)]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weaving/monthly-data
 * 获取所有月度数据（用于历史趋势）
 */
app.get('/api/weaving/monthly-data', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM weaving_monthly_data ORDER BY year DESC, month DESC LIMIT 12'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 织造工段机台月度产量记录 API
// ========================================

/**
 * GET /api/weaving/machine-records/:year/:month
 * 获取指定月份的机台产量记录
 */
app.get('/api/weaving/machine-records/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM weaving_machine_monthly_records WHERE year = $1 AND month = $2 ORDER BY machine_id',
      [year, month]
    );
    const records = rows.map(row => ({
      machineId: row.machine_id,
      actualOutput: parseFloat(row.actual_output),
      weftDensity: parseFloat(row.weft_density),
      machineWidth: parseFloat(row.machine_width),
      speedType: row.speed_type,
      equivalentOutput: parseFloat(row.equivalent_output)
    }));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weaving/machine-records
 * 批量保存机台产量记录
 */
app.post('/api/weaving/machine-records', async (req, res) => {
  try {
    const { year, month, records } = req.body;
    
    // 使用事务批量插入/更新
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const record of records) {
        await client.query(
          `INSERT INTO weaving_machine_monthly_records 
            (year, month, machine_id, actual_output, weft_density, machine_width, speed_type, equivalent_output)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (year, month, machine_id) DO UPDATE SET
             actual_output = $4, weft_density = $5, machine_width = $6, speed_type = $7, equivalent_output = $8`,
          [year, month, record.machineId, record.actualOutput, record.weftDensity, record.machineWidth, record.speedType, record.equivalentOutput]
        );
      }
      
      await client.query('COMMIT');
      res.json({ success: true, count: records.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 启动服务器
// ========================================

/** 服务器端口，默认 3000 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`后端服务器已启动: http://localhost:${PORT}`);
  console.log(`API 端点地址: http://localhost:${PORT}/api/*`);
});
