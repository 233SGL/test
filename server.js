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
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';

// 加载环境变量配置
dotenv.config({ path: '.env.server' });

// 🚀 最早的启动日志 - 确认 Node.js 进程开始执行
console.log('===========================================');
console.log('[STARTUP] Node.js 进程已启动');
console.log('[STARTUP] 时间:', new Date().toISOString());
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] PORT:', process.env.PORT);
console.log('===========================================');

const { Pool } = pg;
const app = express();

// 中间件配置
app.use(cors());        // 允许跨域请求
app.use(express.json()); // 解析 JSON 请求体

// 🔴 最早的请求日志（调试用：确认请求到达服务器）
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

// 安全头部中间件
app.use((req, res, next) => {
  // 防止 MIME 类型嗅探攻击
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // 使用现代缓存控制头，移除已弃用的头部
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.removeHeader('Pragma');
  res.removeHeader('Expires');
  next();
});

// 请求日志中间件（生产环境调试用）
app.use((req, res, next) => {
  // 只记录 API 请求，避免日志过多
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// 确保 JSON 响应使用正确的 charset
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

// ========================================
// 数据库连接配置
// ========================================

// 检查 DATABASE_URL 环境变量
// Zeabur 等云平台通过环境变量提供，本地开发通过 .env.server 文件
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ 错误：DATABASE_URL 环境变量未设置');
  console.error('   请在 Zeabur 控制面板中设置 DATABASE_URL 环境变量');
  console.error('   或确保 .env.server 文件存在且包含 DATABASE_URL');
  // 不立即退出，让服务器启动以便查看日志
} else {
  console.log('✅ DATABASE_URL 已配置');
  // 只显示部分信息，避免泄露密码
  const urlPreview = databaseUrl.substring(0, 30) + '...';
  console.log(`   连接地址: ${urlPreview}`);
}

/**
 * 数据库连接池配置
 * 使用 Supabase Session Pooler 连接
 */
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

// ========================================
// 认证中间件
// ========================================

/**
 * 管理员权限验证中间件
 * 验证请求头中的 x-user-id 对应的用户是否有 MANAGE_SYSTEM 权限
 */
const requireAdminAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: '未授权：缺少用户标识' });
    }

    // 查询用户权限
    const { rows } = await pool.query(
      'SELECT permissions FROM system_users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '未授权：用户不存在' });
    }

    const permissions = rows[0].permissions || [];

    // 检查是否有 MANAGE_SYSTEM 权限
    if (!permissions.includes('MANAGE_SYSTEM')) {
      return res.status(403).json({ error: '权限不足：需要系统管理权限' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: '权限验证失败' });
  }
};

/**
 * 基础认证中间件
 * 仅验证用户已登录（x-user-id 对应的用户存在）
 */
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: '未授权：缺少用户标识' });
    }

    // 查询用户是否存在
    const { rows } = await pool.query(
      'SELECT id, permissions FROM system_users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '未授权：用户不存在' });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: rows[0].id,
      permissions: rows[0].permissions || []
    };

    next();
  } catch (error) {
    res.status(500).json({ error: '认证验证失败' });
  }
};

/**
 * 权限验证中间件工厂
 * 验证用户是否有指定权限
 * @param {string} permission - 所需权限名称
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'];

      if (!userId) {
        return res.status(401).json({ error: '未授权：缺少用户标识' });
      }

      // 查询用户权限
      const { rows } = await pool.query(
        'SELECT id, permissions FROM system_users WHERE id = $1',
        [userId]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: '未授权：用户不存在' });
      }

      const permissions = rows[0].permissions || [];

      // 检查是否有所需权限
      if (!permissions.includes(permission)) {
        return res.status(403).json({ error: `权限不足：需要 ${permission} 权限` });
      }

      // 将用户信息附加到请求对象
      req.user = {
        id: rows[0].id,
        permissions
      };

      next();
    } catch (error) {
      res.status(500).json({ error: '权限验证失败' });
    }
  };
};

// ========================================
// 登录速率限制（防暴力破解）
// ========================================

/**
 * 登录尝试记录存储
 * 格式: IP -> { count: number, lockedUntil: number }
 */
const loginAttempts = new Map();

/** 最大登录尝试次数 */
const MAX_LOGIN_ATTEMPTS = 5;
/** 锁定时间（毫秒）- 15分钟 */
const LOCKOUT_DURATION = 15 * 60 * 1000;
/** 尝试记录过期时间（毫秒）- 30分钟 */
const ATTEMPT_EXPIRY = 30 * 60 * 1000;

/**
 * 获取客户端 IP 地址
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

/**
 * 检查登录是否被限制
 * @returns {object} { isLocked, remainingMinutes }
 */
function checkLoginRateLimit(ip) {
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return { isLocked: false };
  }

  const now = Date.now();

  // 检查是否在锁定期内
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remainingMs = attempt.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // 如果锁定已过期，清除记录
  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    loginAttempts.delete(ip);
    return { isLocked: false };
  }

  return { isLocked: false };
}

/**
 * 记录登录失败
 * @returns {boolean} 是否应该锁定
 */
function recordLoginFailure(ip) {
  const now = Date.now();
  let attempt = loginAttempts.get(ip);

  if (!attempt) {
    attempt = { count: 1, lastAttempt: now };
  } else {
    // 如果上次尝试超过过期时间，重置计数
    if (now - attempt.lastAttempt > ATTEMPT_EXPIRY) {
      attempt = { count: 1, lastAttempt: now };
    } else {
      attempt.count++;
      attempt.lastAttempt = now;
    }
  }

  // 达到最大尝试次数，设置锁定
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION;
    loginAttempts.set(ip, attempt);
    console.log(`[SECURITY] IP ${ip} 已被锁定 ${LOCKOUT_DURATION / 60000} 分钟`);
    return true;
  }

  loginAttempts.set(ip, attempt);
  return false;
}

/**
 * 清除登录失败记录（登录成功时调用）
 */
function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// 定期清理过期的登录记录（每5分钟）
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > ATTEMPT_EXPIRY) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);


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
    // 详细记录错误以便调试
    console.error('[HEALTH] 数据库连接失败:', error.message);
    console.error('[HEALTH] 错误详情:', error.code, error.stack?.split('\n')[0]);
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
    // 转换数据库字段名为驼峰命名
    const employees = rows.map(row => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      workshopId: row.workshop_id,
      department: row.department,
      position: row.position,
      joinDate: row.join_date,
      standardBaseScore: parseFloat(row.standard_base_score) || 0,
      status: row.status,
      phone: row.phone,
      expectedDailyHours: parseFloat(row.expected_daily_hours) || 12,
      machineId: row.machine_id,
      baseSalary: parseFloat(row.base_salary) || 0,
      coefficient: parseFloat(row.coefficient) || 1.0
    }));
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/employees
 * 创建新员工
 * @body {id, name, gender, workshopId, department, position, joinDate, standardBaseScore, status, phone, expectedDailyHours, baseSalary, coefficient}
 */
app.post('/api/employees', requirePermission('MANAGE_EMPLOYEES'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'INSERT INTO employees (id, name, gender, workshop_id, department, position, join_date, standard_base_score, status, phone, expected_daily_hours, base_salary, coefficient) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [req.body.id, req.body.name, req.body.gender, req.body.workshopId, req.body.department, req.body.position, req.body.joinDate, req.body.standardBaseScore, req.body.status, req.body.phone, req.body.expectedDailyHours, req.body.baseSalary || 0, req.body.coefficient || 1.0]
    );

    // 记录审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    await logAudit(userId, userName, 'CREATE', 'employee', req.body.id, req.body.name, req.body, req);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', requirePermission('MANAGE_EMPLOYEES'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE employees SET name=$2, gender=$3, workshop_id=$4, department=$5, position=$6, join_date=$7, standard_base_score=$8, status=$9, phone=$10, expected_daily_hours=$11, base_salary=$12, coefficient=$13 WHERE id=$1 RETURNING *',
      [req.params.id, req.body.name, req.body.gender, req.body.workshopId, req.body.department, req.body.position, req.body.joinDate, req.body.standardBaseScore, req.body.status, req.body.phone, req.body.expectedDailyHours, req.body.baseSalary || 0, req.body.coefficient || 1.0]
    );

    // 记录审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    await logAudit(userId, userName, 'UPDATE', 'employee', req.params.id, req.body.name, req.body, req);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', requirePermission('MANAGE_EMPLOYEES'), async (req, res) => {
  try {
    // 先查询员工信息用于日志
    const { rows: empRows } = await pool.query('SELECT name FROM employees WHERE id = $1', [req.params.id]);
    const empName = empRows[0]?.name || req.params.id;

    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);

    // 记录审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    await logAudit(userId, userName, 'DELETE', 'employee', req.params.id, empName, null, req);

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

/**
 * PUT /api/workshops/:id
 * 更新或创建工段（支持更新部门/文件夹）
 */
app.put('/api/workshops/:id', requirePermission('MANAGE_EMPLOYEES'), async (req, res) => {
  try {
    const { name, code, departments } = req.body;

    // 使用 UPSERT 确保新工段也能被创建
    // 注意：departments 列可能是 JSONB 类型，需要 stringify
    const { rows } = await pool.query(
      `INSERT INTO workshops (id, name, code, departments) 
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET 
         name = $2, 
         code = $3, 
         departments = $4::jsonb
       RETURNING *`,
      [req.params.id, name, code, JSON.stringify(departments)]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/workshops/:id/rename-folder
 * 原子操作重命名文件夹（使用数据库事务）
 * 安全改进：确保文件夹重命名和员工更新在同一事务中完成
 */
app.post('/api/workshops/:id/rename-folder', requirePermission('MANAGE_EMPLOYEES'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { oldName, newName } = req.body;
    const workshopId = req.params.id;

    // 输入验证
    if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
      return res.status(400).json({ error: '文件夹名称不能为空' });
    }

    if (newName.length > 50 || oldName.length > 50) {
      return res.status(400).json({ error: '文件夹名称不能超过50字符' });
    }

    // 开始事务
    await client.query('BEGIN');

    // 1. 获取当前工段信息
    const { rows: workshopRows } = await client.query(
      'SELECT departments FROM workshops WHERE id = $1 FOR UPDATE',
      [workshopId]
    );

    if (!workshopRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '工段不存在' });
    }

    let departments = workshopRows[0].departments || [];

    // 检查旧文件夹是否存在
    if (!departments.includes(oldName)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '原文件夹不存在' });
    }

    // 检查新文件夹名是否已被使用
    if (departments.includes(newName)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: '新文件夹名称已存在' });
    }

    // 2. 更新工段的 departments（替换旧名称为新名称）
    departments = departments.map(d => d === oldName ? newName : d);
    await client.query(
      'UPDATE workshops SET departments = $1::jsonb WHERE id = $2',
      [JSON.stringify(departments), workshopId]
    );

    // 3. 批量更新员工的部门字段
    await client.query(
      'UPDATE employees SET department = $1 WHERE workshop_id = $2 AND department = $3',
      [newName, workshopId, oldName]
    );

    // 提交事务
    await client.query('COMMIT');

    res.json({ success: true, message: '文件夹重命名成功', newDepartments: departments });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
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
 * POST /api/auth/login
 * 服务端 PIN 验证（安全改进：PIN 不应在前端比较）
 * 已添加速率限制防止暴力破解
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const clientIP = getClientIP(req);

    // 检查是否被锁定
    const rateLimit = checkLoginRateLimit(clientIP);
    if (rateLimit.isLocked) {
      console.log(`[SECURITY] 登录被拒绝 - IP ${clientIP} 已被锁定`);
      return res.status(429).json({
        success: false,
        error: `登录尝试次数过多，请 ${rateLimit.remainingMinutes} 分钟后再试`
      });
    }

    if (!userId || !pin) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    // 查询用户信息（包括 PIN 码进行验证）
    const { rows } = await pool.query(
      'SELECT id, username, display_name, role, custom_role_name, pin_code, is_system, scopes, permissions FROM system_users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      recordLoginFailure(clientIP);
      return res.status(401).json({ success: false, error: '用户不存在' });
    }

    const user = rows[0];

    // 服务端验证 PIN 码
    if (user.pin_code !== pin) {
      // 记录登录失败
      await logLogin(userId, user.display_name || user.username, 'LOGIN_FAILED', req);
      const shouldLock = recordLoginFailure(clientIP);
      if (shouldLock) {
        return res.status(429).json({
          success: false,
          error: `登录尝试次数过多，请 15 分钟后再试`
        });
      }
      return res.status(401).json({ success: false, error: 'PIN 码错误' });
    }

    // 验证成功，清除失败记录
    clearLoginAttempts(clientIP);

    // 记录登录成功
    await logLogin(userId, user.display_name || user.username, 'LOGIN', req);

    // 返回用户信息（不包含 PIN 码）
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        customRoleName: user.custom_role_name,
        isSystem: user.is_system,
        scopes: user.scopes || [],
        permissions: user.permissions || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users
 * 获取所有系统用户列表（不包含敏感信息如 PIN 码）
 */
app.get('/api/users', async (req, res) => {
  try {
    // 安全改进：不返回 pin_code 字段
    const { rows } = await pool.query(
      'SELECT id, username, display_name, role, custom_role_name, is_system, scopes, permissions FROM system_users ORDER BY id'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', requirePermission('MANAGE_SYSTEM'), async (req, res) => {
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

    // 记录审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    await logAudit(userId, userName, 'CREATE', 'user', id, displayName, { username, role, scopes, permissions }, req);

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', requirePermission('MANAGE_SYSTEM'), async (req, res) => {
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

    // 记录审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    await logAudit(userId, userName, 'UPDATE', 'user', req.params.id, displayName, { username, role, scopes, permissions }, req);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', requirePermission('MANAGE_SYSTEM'), async (req, res) => {
  try {
    // 先查询用户信息用于日志
    const { rows: userRows } = await pool.query('SELECT display_name FROM system_users WHERE id = $1', [req.params.id]);
    const targetName = userRows[0]?.display_name || req.params.id;

    await pool.query('DELETE FROM system_users WHERE id = $1', [req.params.id]);

    // 记录审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    await logAudit(userId, userName, 'DELETE', 'user', req.params.id, targetName, null, req);

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
      machineId: row.machine_id,
      team: row.team,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
      joinDate, phone, status, notes, machineId, team
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE weaving_employees SET
        name = $2, gender = $3, position = $4, base_salary = $5, coefficient = $6,
        join_date = $7, phone = $8, status = $9, notes = $10,
        machine_id = $11, team = $12
       WHERE id = $1 RETURNING *`,
      [req.params.id, name, gender, position, baseSalary, coefficient, joinDate, phone, status, notes, machineId, team]
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
      effectiveWidth: parseFloat(row.effective_width) || 7.7,
      speedWeftPerMin: parseInt(row.speed_weft_per_min) || 41,
      targetOutput: parseFloat(row.target_output),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
    const { name, speedType, width, effectiveWidth, speedWeftPerMin, targetOutput, status } = req.body;
    // 只更新提供的字段，保留未提供字段的原值
    const updateFields = [];
    const values = [req.params.id];
    let paramIndex = 2;

    if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); values.push(name); }
    if (speedType !== undefined) { updateFields.push(`speed_type = $${paramIndex++}`); values.push(speedType); }
    if (width !== undefined) { updateFields.push(`width = $${paramIndex++}`); values.push(width); }
    if (effectiveWidth !== undefined) { updateFields.push(`effective_width = $${paramIndex++}`); values.push(effectiveWidth); }
    if (speedWeftPerMin !== undefined) { updateFields.push(`speed_weft_per_min = $${paramIndex++}`); values.push(speedWeftPerMin); }
    if (targetOutput !== undefined) { updateFields.push(`target_output = $${paramIndex++}`); values.push(targetOutput); }
    if (status !== undefined) { updateFields.push(`status = $${paramIndex++}`); values.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    const { rows } = await pool.query(
      `UPDATE weaving_machines SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`,
      values
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
      memberBaseSalary: parseFloat(rows[0].member_base_salary),
      updatedAt: rows[0].updated_at
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
// 织造工段产品/网种管理 API
// ========================================

/**
 * GET /api/weaving/products
 * 获取所有网种/产品
 */
app.get('/api/weaving/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM weaving_products ORDER BY id');
    const products = rows.map(row => ({
      id: row.id,
      name: row.name,
      weftDensity: parseFloat(row.weft_density),
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weaving/products
 * 创建新网种/产品（带严格验证，防止文件导入注入）
 */
app.post('/api/weaving/products', async (req, res) => {
  try {
    const { id, name, weftDensity, description, isActive } = req.body;

    // 输入验证 - 防止恶意数据注入
    const errors = [];

    // 验证必填字段
    if (!id || typeof id !== 'string') {
      errors.push('产品ID必须是非空字符串');
    } else if (id.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      errors.push('产品ID只能包含字母、数字、下划线和连字符，最多50字符');
    }

    if (!name || typeof name !== 'string') {
      errors.push('产品名称必须是非空字符串');
    } else if (name.length > 100) {
      errors.push('产品名称不能超过100字符');
    }

    // 验证纬密（应该是数字）
    if (weftDensity !== undefined && weftDensity !== null) {
      const density = parseFloat(weftDensity);
      if (isNaN(density) || density < 0 || density > 100) {
        errors.push('纬密必须是0-100之间的数字');
      }
    }

    // 验证描述（可选）
    if (description && (typeof description !== 'string' || description.length > 500)) {
      errors.push('描述不能超过500字符');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: '输入验证失败', details: errors });
    }

    // 清理输入
    const cleanId = id.trim().substring(0, 50);
    const cleanName = name.trim().substring(0, 100);
    const cleanDensity = weftDensity ? parseFloat(weftDensity) : 13;
    const cleanDescription = description ? description.trim().substring(0, 500) : '';

    const { rows } = await pool.query(
      `INSERT INTO weaving_products (id, name, weft_density, description, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cleanId, cleanName, cleanDensity, cleanDescription, isActive !== false]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: '产品ID已存在' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * PUT /api/weaving/products/:id
 * 更新网种/产品信息
 */
app.put('/api/weaving/products/:id', async (req, res) => {
  try {
    const { name, weftDensity, description, isActive } = req.body;
    const { rows } = await pool.query(
      `UPDATE weaving_products SET name = $2, weft_density = $3, description = $4, is_active = $5
       WHERE id = $1 RETURNING *`,
      [req.params.id, name, weftDensity, description, isActive]
    );
    if (!rows[0]) return res.status(404).json({ error: '产品不存在' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/weaving/products/:id
 * 删除网种/产品
 */
app.delete('/api/weaving/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM weaving_products WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 织造工段生产记录 API（核心：每张网一条记录）
// ========================================

/**
 * GET /api/weaving/production-records
 * 获取生产记录，支持筛选
 * @query year - 年份（必填）
 * @query month - 月份（必填）
 * @query machineId - 机台筛选（可选）
 * @query productId - 产品筛选（可选）
 */
app.get('/api/weaving/production-records', async (req, res) => {
  try {
    const { year, month, machineId, productId } = req.query;

    let query = 'SELECT * FROM weaving_production_records WHERE year = $1 AND month = $2';
    const params = [year, month];

    if (machineId) {
      params.push(machineId);
      query += ` AND machine_id = $${params.length}`;
    }
    if (productId) {
      params.push(productId);
      query += ` AND product_id = $${params.length}`;
    }

    query += ' ORDER BY production_date DESC, id DESC';

    const { rows } = await pool.query(query, params);
    const records = rows.map(row => ({
      id: row.id,
      year: row.year,
      month: row.month,
      productionDate: row.production_date,
      machineId: row.machine_id,
      productId: row.product_id,
      length: parseFloat(row.length),
      machineWidth: parseFloat(row.machine_width),
      weftDensity: parseFloat(row.weft_density),
      speedType: row.speed_type,
      actualArea: parseFloat(row.actual_area),
      outputCoef: parseFloat(row.output_coef),
      widthCoef: parseFloat(row.width_coef),
      speedCoef: parseFloat(row.speed_coef),
      equivalentOutput: parseFloat(row.equivalent_output),
      startTime: row.start_time,
      endTime: row.end_time,
      qualityGrade: row.quality_grade,
      isQualified: row.is_qualified,
      notes: row.notes,
      createdAt: row.created_at
    }));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/weaving/production-records
 * 新增生产记录（触发器会自动计算等效产量）
 */
app.post('/api/weaving/production-records', async (req, res) => {
  try {
    const {
      productionDate, machineId, productId, length,
      startTime, endTime, qualityGrade, isQualified, notes
    } = req.body;

    // 从日期提取年月
    const date = new Date(productionDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const { rows } = await pool.query(
      `INSERT INTO weaving_production_records 
        (year, month, production_date, machine_id, product_id, length, start_time, end_time, quality_grade, is_qualified, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [year, month, productionDate, machineId, productId, length, startTime || null, endTime || null, qualityGrade || 'A', isQualified !== false, notes]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/weaving/production-records/:id
 * 更新生产记录（支持部分更新）
 */
app.put('/api/weaving/production-records/:id', async (req, res) => {
  try {
    const { length, qualityGrade, isQualified, notes } = req.body;

    // 获取当前记录
    const { rows: current } = await pool.query(
      'SELECT * FROM weaving_production_records WHERE id = $1',
      [req.params.id]
    );
    if (!current[0]) return res.status(404).json({ error: '记录不存在' });

    // 合并更新字段
    const record = current[0];
    const newLength = length !== undefined ? length : record.length;
    const newQualityGrade = qualityGrade !== undefined ? qualityGrade : record.quality_grade;
    const newIsQualified = isQualified !== undefined ? isQualified : record.is_qualified;
    const newNotes = notes !== undefined ? notes : record.notes;

    // 更新记录（触发器会重新计算等效产量）
    const { rows } = await pool.query(
      `UPDATE weaving_production_records SET
        length = $2, quality_grade = $3, is_qualified = $4, notes = $5
       WHERE id = $1 RETURNING *`,
      [req.params.id, newLength, newQualityGrade, newIsQualified, newNotes]
    );

    // 转换字段名为驼峰
    const result = {
      id: rows[0].id,
      year: rows[0].year,
      month: rows[0].month,
      productionDate: rows[0].production_date,
      machineId: rows[0].machine_id,
      productId: rows[0].product_id,
      length: parseFloat(rows[0].length),
      machineWidth: parseFloat(rows[0].machine_width),
      weftDensity: parseFloat(rows[0].weft_density),
      actualArea: parseFloat(rows[0].actual_area),
      equivalentOutput: parseFloat(rows[0].equivalent_output),
      qualityGrade: rows[0].quality_grade,
      isQualified: rows[0].is_qualified,
      notes: rows[0].notes,
      createdAt: rows[0].created_at
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/weaving/production-records/:id
 * 删除生产记录
 */
app.delete('/api/weaving/production-records/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM weaving_production_records WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 织造工段月度汇总 API
// ========================================

/**
 * GET /api/weaving/monthly-summary/:year/:month
 * 获取指定月份的汇总数据（从生产记录聚合）
 */
app.get('/api/weaving/monthly-summary/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;

    // 从生产记录聚合数据
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as total_nets,
        COALESCE(SUM(length), 0) as total_length,
        COALESCE(SUM(actual_area), 0) as total_area,
        COALESCE(SUM(equivalent_output), 0) as total_equivalent,
        COUNT(*) FILTER (WHERE is_qualified) as qualified_nets
      FROM weaving_production_records
      WHERE year = $1 AND month = $2
    `, [year, month]);

    const summary = rows[0];
    const netFormationRate = summary.total_nets > 0
      ? (summary.qualified_nets / summary.total_nets * 100).toFixed(2)
      : 0;

    // 获取活跃机台数
    const machineResult = await pool.query(
      "SELECT COUNT(*) as count FROM weaving_machines WHERE status = 'running'"
    );

    // 获取操作工人数
    const operatorResult = await pool.query(
      "SELECT COUNT(*) as count FROM weaving_employees WHERE position = 'operator' AND status = 'active'"
    );

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      totalNets: parseInt(summary.total_nets),
      totalLength: parseFloat(summary.total_length),
      totalArea: parseFloat(summary.total_area),
      equivalentOutput: parseFloat(summary.total_equivalent),
      qualifiedNets: parseInt(summary.qualified_nets),
      netFormationRate: parseFloat(netFormationRate),
      activeMachines: parseInt(machineResult.rows[0].count),
      actualOperators: parseInt(operatorResult.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/weaving/machine-summary/:year/:month
 * 获取指定月份各机台汇总数据
 */
app.get('/api/weaving/machine-summary/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;

    const { rows } = await pool.query(`
      SELECT 
        machine_id,
        COUNT(*) as net_count,
        SUM(length) as total_length,
        SUM(actual_area) as total_area,
        SUM(equivalent_output) as total_equivalent
      FROM weaving_production_records
      WHERE year = $1 AND month = $2
      GROUP BY machine_id
      ORDER BY machine_id
    `, [year, month]);

    const summary = rows.map(row => ({
      machineId: row.machine_id,
      netCount: parseInt(row.net_count),
      totalLength: parseFloat(row.total_length),
      totalArea: parseFloat(row.total_area),
      totalEquivalent: parseFloat(row.total_equivalent)
    }));

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 旧版 API（保留兼容性）
// ========================================

/**
 * GET /api/weaving/machine-records/:year/:month
 * 获取指定月份的机台产量记录（旧版兼容）
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
    // 如果旧表不存在，返回空数组
    if (error.message.includes('does not exist')) {
      res.json([]);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * POST /api/weaving/machine-records
 * 批量保存机台产量记录（旧版兼容）
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
// 后台管理 API
// ========================================

/**
 * 解码用户名的辅助函数
 * 处理前端传递的 URI 编码的中文字符
 */
function decodeUserName(userName) {
  try {
    // 如果用户名已经是编码的，尝试解码
    return decodeURIComponent(userName);
  } catch {
    // 如果解码失败（可能已经解码过了），返回原始值
    return userName;
  }
}

/**
 * 记录审计日志的辅助函数
 */
async function logAudit(userId, username, action, targetType, targetId, targetName, details, req) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, username, action, target_type, target_id, target_name, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, username, action, targetType, targetId, targetName, JSON.stringify(details),
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        req?.headers?.['user-agent'] || 'unknown']
    );
  } catch (err) {
    console.error('审计日志记录失败:', err.message);
  }
}

/**
 * 记录登录历史的辅助函数
 */
async function logLogin(userId, username, action, req) {
  try {
    await pool.query(
      `INSERT INTO login_history (user_id, username, action, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, username, action,
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        req?.headers?.['user-agent'] || 'unknown']
    );
  } catch (err) {
    console.error('登录历史记录失败:', err.message);
  }
}

/**
 * GET /api/admin/audit-logs
 * 获取操作日志列表（支持分页和筛选）
 */
app.get('/api/admin/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, targetType, userId, startDate, endDate, search, dateFrom, dateTo } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (action) {
      whereClause += ` AND action = $${paramIndex++}`;
      params.push(action);
    }
    if (targetType) {
      whereClause += ` AND target_type = $${paramIndex++}`;
      params.push(targetType);
    }
    if (userId) {
      whereClause += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }
    // 支持 search 参数 - 搜索用户名和目标名称
    if (search) {
      whereClause += ` AND (username ILIKE $${paramIndex} OR target_name ILIKE $${paramIndex++})`;
      params.push(`%${search}%`);
    }
    // 支持 dateFrom 和 dateTo (兼容旧的 startDate/endDate)
    const fromDate = dateFrom || startDate;
    const toDate = dateTo || endDate;
    if (fromDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(fromDate);
    }
    if (toDate) {
      // 结束日期加一天以包含当天
      whereClause += ` AND created_at < ($${paramIndex++}::date + interval '1 day')`;
      params.push(toDate);
    }

    const countQuery = `SELECT COUNT(*) FROM audit_logs WHERE 1=1 ${whereClause}`;
    const dataQuery = `SELECT * FROM audit_logs WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, parseInt(limit), offset])
    ]);

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      data: dataResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/admin/login-history
 * 获取登录历史列表
 */
app.get('/api/admin/login-history', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (userId) {
      whereClause = ' WHERE user_id = $1';
      params.push(userId);
    }

    const countQuery = `SELECT COUNT(*) FROM login_history ${whereClause}`;
    const dataQuery = `SELECT * FROM login_history ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, parseInt(limit), offset])
    ]);

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      data: dataResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users-online
 * 获取当前在线用户（基于活跃会话）
 */
app.get('/api/admin/users-online', async (req, res) => {
  try {
    // 5分钟内有活动的用户视为在线
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (user_id) user_id, username, ip_address, last_activity, created_at
      FROM active_sessions
      WHERE last_activity > NOW() - INTERVAL '5 minutes'
      ORDER BY user_id, last_activity DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/verify
 * 验证管理员身份（使用统一的管理员账户密码）
 */
app.post('/api/admin/verify', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 获取请求用户信息
    const { rows: userRows } = await pool.query(
      'SELECT id, username FROM system_users WHERE id = $1',
      [userId]
    );

    if (userRows.length === 0) {
      return res.json({ verified: false, error: '用户不存在' });
    }

    const requestUser = userRows[0];

    // 获取统一的管理员账户密码（使用 admin 账户的 PIN 码）
    const { rows: adminRows } = await pool.query(
      "SELECT pin_code FROM system_users WHERE username = 'admin' LIMIT 1"
    );

    if (adminRows.length === 0) {
      return res.json({ verified: false, error: '管理员账户不存在' });
    }

    const adminPinCode = adminRows[0].pin_code;

    // 验证输入的密码是否与管理员密码一致
    if (adminPinCode !== password) {
      // 记录失败的验证尝试
      await logLogin(userId, requestUser.username, 'ADMIN_VERIFY_FAILED', req);
      return res.json({ verified: false, error: '管理员密码错误' });
    }

    // 验证成功，记录日志
    await logAudit(userId, requestUser.username, 'ADMIN_ACCESS', 'admin', null, '敏感页面访问',
      { action: '管理员密码验证通过' }, req);

    res.json({ verified: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/verify-pin
 * 验证管理员 PIN 码（用于危险操作的二次确认）
 * 使用 admin 账户的 PIN 码作为主密码
 * 已添加速率限制防止暴力破解
 */
app.post('/api/admin/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const clientIP = getClientIP(req);

    // 检查是否被锁定（与登录使用相同的速率限制）
    const rateLimit = checkLoginRateLimit(clientIP);
    if (rateLimit.isLocked) {
      console.log(`[SECURITY] PIN 验证被拒绝 - IP ${clientIP} 已被锁定`);
      return res.status(429).json({
        error: `尝试次数过多，请 ${rateLimit.remainingMinutes} 分钟后再试`
      });
    }

    if (!pin) {
      return res.status(400).json({ error: '缺少 PIN 码' });
    }

    // 获取 admin 账户的 PIN 码
    const { rows: adminRows } = await pool.query(
      "SELECT pin_code FROM system_users WHERE username = 'admin' LIMIT 1"
    );

    if (adminRows.length === 0) {
      return res.status(500).json({ error: '管理员账户不存在' });
    }

    const adminPinCode = adminRows[0].pin_code;

    // 验证输入的 PIN 是否与管理员 PIN 一致
    if (adminPinCode !== pin) {
      const shouldLock = recordLoginFailure(clientIP);
      if (shouldLock) {
        return res.status(429).json({
          error: `尝试次数过多，请 15 分钟后再试`
        });
      }
      return res.status(401).json({ error: 'PIN 码错误' });
    }

    // 验证成功，清除失败记录
    clearLoginAttempts(clientIP);
    res.json({ verified: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/login-record
 * 记录登录历史（登录成功/失败）
 */
app.post('/api/admin/login-record', async (req, res) => {
  try {
    const { userId, username, action } = req.body;

    if (!userId || !username || !action) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 使用 logLogin 辅助函数记录到 login_history 表
    await logLogin(userId, username, action, req);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * POST /api/admin/heartbeat
 * 更新用户会话心跳（用于在线状态追踪）
 */
app.post('/api/admin/heartbeat', async (req, res) => {
  try {
    const { sessionId, userId, username } = req.body;
    if (!sessionId || !userId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    await pool.query(`
      INSERT INTO active_sessions (id, user_id, username, ip_address, user_agent, last_activity)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET last_activity = NOW()
    `, [sessionId, userId, username,
      req.ip || req.headers['x-forwarded-for'] || 'unknown',
      req.headers['user-agent'] || 'unknown']);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/session/:sessionId
 * 删除会话（用于登出）
 */
app.delete('/api/admin/session/:sessionId', async (req, res) => {
  try {
    await pool.query('DELETE FROM active_sessions WHERE id = $1', [req.params.sessionId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/database/tables
 * 获取数据库表结构信息
 */
app.get('/api/admin/database/tables', requireAdminAuth, async (req, res) => {
  try {
    // 获取所有表及其列信息
    const { rows: tables } = await pool.query(`
      SELECT 
        t.table_name,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);

    // 获取每个表的行数
    const tablesWithCount = await Promise.all(tables.map(async (table) => {
      try {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
        return { ...table, row_count: parseInt(rows[0].count) };
      } catch {
        return { ...table, row_count: 0 };
      }
    }));

    res.json(tablesWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/database/tables/:tableName
 * 获取指定表的详细结构
 */
app.get('/api/admin/database/tables/:tableName', requireAdminAuth, async (req, res) => {
  try {
    const { tableName } = req.params;

    // 获取列信息
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    // 获取行数
    const { rows: countResult } = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);

    res.json({
      tableName,
      columns,
      rowCount: parseInt(countResult[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/database/tables/:tableName/data
 * 获取表数据预览（只读，限制100条）
 */
app.get('/api/admin/database/tables/:tableName/data', requireAdminAuth, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 安全检查：只允许预设的表名，防止SQL注入
    const allowedTables = [
      'employees', 'workshops', 'system_users', 'settings',
      'monthly_data', 'audit_logs', 'login_history', 'active_sessions',
      'weaving_employees', 'weaving_machines', 'weaving_config',
      'weaving_monthly_data', 'weaving_production_records', 'weaving_products'
    ];

    if (!allowedTables.includes(tableName)) {
      return res.status(403).json({ error: '不允许访问该表' });
    }

    const { rows: countResult } = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const { rows: data } = await pool.query(
      `SELECT * FROM "${tableName}" ORDER BY 1 LIMIT $1 OFFSET $2`,
      [Math.min(parseInt(limit), 100), offset]
    );

    res.json({
      total: parseInt(countResult[0].count),
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * 获取系统概览统计
 */
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [
      employeeCount,
      userCount,
      logCount,
      onlineCount
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM employees WHERE status != 'terminated'"),
      pool.query("SELECT COUNT(*) FROM system_users"),
      pool.query("SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(DISTINCT user_id) FROM active_sessions WHERE last_activity > NOW() - INTERVAL '5 minutes'")
    ]);

    res.json({
      activeEmployees: parseInt(employeeCount.rows[0].count),
      systemUsers: parseInt(userCount.rows[0].count),
      logsToday: parseInt(logCount.rows[0].count),
      onlineUsers: parseInt(onlineCount.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ========================================
// 数据库备份与恢复 API
// ========================================

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// 确保备份目录存在
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);

/**
 * 执行全量备份
 */
async function performBackup(isAuto = false) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const type = isAuto ? 'auto' : 'manual';
  const filename = `backup-${type}-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    const tables = [
      'system_users', 'employees', 'weaving_employees',
      'weaving_machines', 'monthly_data', 'audit_logs', 'login_history'
    ];

    // Check if workshops table exists or use static data if table missing
    // Since original code had /api/workshops from DB, we include it if it exists.
    // We'll wrap in try/catch for each table to be safe

    const dbData = {};
    for (const table of tables) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${table}`);
        dbData[table] = rows;
      } catch (err) {
        console.warn(`[Backup] Skiping table ${table}: ${err.message}`);
      }
    }

    const backupData = {
      version: '2.5',
      timestamp: new Date().toISOString(),
      type,
      data: dbData
    };

    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
    console.log(`[Backup] Created ${filename}`);

    // 清理旧备份 (保留最近30天)
    if (isAuto) {
      const files = await fs.readdir(BACKUP_DIR);
      const autoBackups = files.filter(f => f.startsWith('backup-auto-'));
      if (autoBackups.length > 30) {
        autoBackups.sort(); // 按时间排序，旧在前
        const toDelete = autoBackups.slice(0, autoBackups.length - 30);
        for (const file of toDelete) {
          await fs.unlink(path.join(BACKUP_DIR, file));
          console.log(`[Backup] Deleted old backup ${file}`);
        }
      }
    }
    return filename;
  } catch (error) {
    console.error('[Backup] Failed:', error);
    throw error;
  }
}

/**
 * 恢复数据
 */
async function restoreBackup(filename) {
  const filepath = path.join(BACKUP_DIR, filename);
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    const backup = JSON.parse(content);

    if (!backup.data) throw new Error('无效的备份文件格式');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 清空现有数据 (注意顺序，避免外键约束)
      // 暂时使用 CASCADE
      const tables = Object.keys(backup.data);
      for (const table of tables) {
        // Simple sanitization
        if (!/^[a-zA-Z0-9_]+$/.test(table)) continue;
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
      }

      // 插入数据
      for (const [table, rows] of Object.entries(backup.data)) {
        if (!rows || rows.length === 0) continue;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) continue;

        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          if (columns.length === 0) continue;

          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          const formattedCols = columns.map(c => `"${c}"`).join(', ');

          await client.query(
            `INSERT INTO "${table}" (${formattedCols}) VALUES (${placeholders})`,
            values
          );
        }
      }

      await client.query('COMMIT');
      console.log(`[Restore] Restored from ${filename}`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Restore] Failed:', error);
    throw error;
  }
}

// 每天凌晨 2:00 自动备份
cron.schedule('0 2 * * *', () => {
  console.log('[Cron] Starting daily backup...');
  performBackup(true);
});

/**
 * GET /api/admin/backups
 * 获取备份列表
 */
app.get('/api/admin/backups', async (req, res) => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = await Promise.all(files.filter(f => f.endsWith('.json')).map(async f => {
      const stats = await fs.stat(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        size: stats.size,
        createdAt: stats.birthtime
      };
    }));
    // 按时间倒序
    backups.sort((a, b) => b.createdAt - a.createdAt);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/backups
 * 创建新备份
 */
app.post('/api/admin/backups', requireAdminAuth, async (req, res) => {
  try {
    const filename = await performBackup(false);

    // 审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    if (typeof logAudit === 'function') {
      await logAudit(userId, userName, 'BACKUP', 'system', null, '创建手动备份', { filename }, req);
    }

    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/backups/:filename
 * 删除备份文件
 */
app.delete('/api/admin/backups/:filename', requireAdminAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: '无效的文件名' });
    }

    await fs.unlink(path.join(BACKUP_DIR, filename));

    // 审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    if (typeof logAudit === 'function') {
      await logAudit(userId, userName, 'DELETE', 'backup', null, '删除备份文件', { filename }, req);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/restore/:filename
 * 恢复数据
 */
app.post('/api/admin/restore/:filename', requireAdminAuth, async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: '无效的文件名' });
    }

    await restoreBackup(filename);

    // 审计日志
    const userId = req.headers['x-user-id'] || 'system';
    const userName = decodeUserName(req.headers['x-user-name']) || 'System';
    if (typeof logAudit === 'function') {
      await logAudit(userId, userName, 'RESTORE', 'system', null, '恢复系统数据', { filename }, req);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 生产环境静态文件托管
// ========================================

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生产环境下托管前端静态文件
 * 开发环境使用 Vite 代理，不需要这个
 */
if (process.env.NODE_ENV === 'production') {
  // 托管 dist 目录下的静态文件
  app.use(express.static(path.join(__dirname, 'dist')));

  // 所有非 /api 的请求都返回 index.html（支持前端路由）
  // 重要：必须显式排除 /api 路由，避免 API 请求返回 HTML
  app.get('*', (req, res, next) => {
    console.log(`[Catch-All] ${req.method} ${req.path}`);
    if (req.path.startsWith('/api')) {
      // API 路由，返回 404 JSON（说明该接口不存在）
      console.log(`[Catch-All] API route not found: ${req.path}`);
      return res.status(404).json({ error: `API endpoint not found: ${req.path}` });
    }
    // 非 API 路由，返回前端页面
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  console.log('生产模式：已启用静态文件托管 (dist/)');
}

// ========================================
// 启动服务器
// ========================================

/** 服务器端口，默认 3000 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`后端服务器已启动: http://localhost:${PORT}`);
  console.log(`API 端点地址: http://localhost:${PORT}/api/*`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`前端页面地址: http://localhost:${PORT}/`);
  }
});
