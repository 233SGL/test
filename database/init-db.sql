-- Run this in Supabase SQL Editor to create tables

-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  departments JSONB
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT,
  workshop_id TEXT REFERENCES workshops(id),
  department TEXT,
  position TEXT,
  join_date DATE,
  standard_base_score NUMERIC,
  status TEXT DEFAULT 'active',
  phone TEXT,
  expected_daily_hours NUMERIC
);

-- System Users
CREATE TABLE IF NOT EXISTS system_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  custom_role_name TEXT,
  pin_code TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  scopes JSONB,
  permissions JSONB
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  announcement TEXT
);

-- Monthly Data
CREATE TABLE IF NOT EXISTS monthly_data (
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (year, month)
);

-- Insert initial workshops
INSERT INTO workshops (id, name, code, departments) VALUES
  ('ws_styling', '定型工段', 'styling', '["定型一车间", "定型二车间", "后整理"]'),
  ('ws_weaving', '织造工段', 'weaving', '["织造一班", "织造二班"]')
ON CONFLICT (id) DO NOTHING;

-- Insert initial settings
INSERT INTO settings (id, announcement) VALUES
  ('global', '安全生产，重在预防。进入车间请务必穿戴好劳保用品。本月产量冲刺目标：20000m²。')
ON CONFLICT (id) DO NOTHING;

-- Insert initial employees (sample)
INSERT INTO employees (id, name, gender, workshop_id, department, position, join_date, standard_base_score, status, phone, expected_daily_hours) VALUES
  ('1', '齐绍兵', 'male', 'ws_styling', '定型一车间', '班长', '2018-03-15', 8000, 'active', '13800138001', 9.5),
  ('2', '张志强', 'male', 'ws_styling', '定型一车间', '主机手', '2019-07-20', 5000, 'active', '13800138002', 8),
  ('3', '王甲贵', 'male', 'ws_styling', '定型一车间', '副机手', '2020-05-10', 7300, 'active', '13800138003', 12),
  ('4', '玉尚杰', 'male', 'ws_styling', '定型一车间', '操作工', '2021-11-11', 5000, 'active', '13800138004', 8),
  ('5', '董华荣', 'male', 'ws_styling', '定型二车间', '主机手', '2019-02-28', 7300, 'active', '13800138005', 12),
  ('6', '肖冬贵', 'male', 'ws_styling', '定型二车间', '操作工', '2020-08-15', 7100, 'active', '13800138006', 12),
  ('7', '郭建文', 'male', 'ws_styling', '定型二车间', '班长', '2017-09-01', 8000, 'active', '13800138007', 12),
  ('8', '陈永松', 'male', 'ws_styling', '后整理', '普工', '2022-03-01', 5500, 'active', '13800138008', 8),
  ('9', '李国辉', 'male', 'ws_styling', '后整理', '质检', '2018-12-12', 8000, 'active', '13800138009', 12)
ON CONFLICT (id) DO NOTHING;

-- Insert initial system user (admin)
INSERT INTO system_users (id, username, display_name, role, pin_code, is_system, scopes, permissions) VALUES
  ('u1', 'admin', '系统管理员', 'ADMIN', '1234', true, '["all"]', 
   '["VIEW_DASHBOARD", "VIEW_PRODUCTION", "VIEW_ATTENDANCE", "VIEW_CALCULATOR", "VIEW_SIMULATION", "VIEW_EMPLOYEES", "EDIT_YIELD", "EDIT_UNIT_PRICE", "EDIT_KPI", "EDIT_FIXED_PACK", "EDIT_HOURS", "EDIT_BASE_SCORE", "EDIT_WEIGHTS", "APPLY_SIMULATION", "VIEW_SENSITIVE", "MANAGE_ANNOUNCEMENTS", "MANAGE_EMPLOYEES", "MANAGE_SYSTEM"]')
ON CONFLICT (id) DO NOTHING;
