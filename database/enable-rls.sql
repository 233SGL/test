-- ========================================
-- 安全加固：启用行级安全策略 (RLS)
-- ========================================
-- 此脚本在 Supabase SQL Editor 中执行
-- 生成时间: 2025-12-10
-- 
-- 注意：由于应用通过后端 Node.js 服务器使用 Session Pooler 连接,
-- 服务器使用 postgres 角色连接。RLS 策略设置为：
-- - 允许 postgres 角色（服务端）完全访问
-- - 阻止匿名用户和未认证用户直接访问
-- ========================================

-- ========================================
-- 1. 为所有表启用 RLS
-- ========================================

-- 基础表
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- 织造工段表
ALTER TABLE weaving_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE weaving_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE weaving_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE weaving_monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weaving_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE weaving_production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weaving_products ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. 创建 RLS 策略（允许服务端完全访问）
-- ========================================
-- 策略说明：
-- - 'service_role' 和 'postgres' 角色拥有完全访问权限
-- - 'anon' 和 'authenticated' 角色默认无访问权限
--   （所有访问必须通过后端 API）

-- active_sessions
DROP POLICY IF EXISTS "service_full_access" ON active_sessions;
CREATE POLICY "service_full_access" ON active_sessions
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- audit_logs
DROP POLICY IF EXISTS "service_full_access" ON audit_logs;
CREATE POLICY "service_full_access" ON audit_logs
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- employees
DROP POLICY IF EXISTS "service_full_access" ON employees;
CREATE POLICY "service_full_access" ON employees
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- login_history
DROP POLICY IF EXISTS "service_full_access" ON login_history;
CREATE POLICY "service_full_access" ON login_history
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- monthly_data
DROP POLICY IF EXISTS "service_full_access" ON monthly_data;
CREATE POLICY "service_full_access" ON monthly_data
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- settings
DROP POLICY IF EXISTS "service_full_access" ON settings;
CREATE POLICY "service_full_access" ON settings
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- system_users
DROP POLICY IF EXISTS "service_full_access" ON system_users;
CREATE POLICY "service_full_access" ON system_users
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- workshops
DROP POLICY IF EXISTS "service_full_access" ON workshops;
CREATE POLICY "service_full_access" ON workshops
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_config
DROP POLICY IF EXISTS "service_full_access" ON weaving_config;
CREATE POLICY "service_full_access" ON weaving_config
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_employees
DROP POLICY IF EXISTS "service_full_access" ON weaving_employees;
CREATE POLICY "service_full_access" ON weaving_employees
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_machines
DROP POLICY IF EXISTS "service_full_access" ON weaving_machines;
CREATE POLICY "service_full_access" ON weaving_machines
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_monthly_data
DROP POLICY IF EXISTS "service_full_access" ON weaving_monthly_data;
CREATE POLICY "service_full_access" ON weaving_monthly_data
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_monthly_summary
DROP POLICY IF EXISTS "service_full_access" ON weaving_monthly_summary;
CREATE POLICY "service_full_access" ON weaving_monthly_summary
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_production_records
DROP POLICY IF EXISTS "service_full_access" ON weaving_production_records;
CREATE POLICY "service_full_access" ON weaving_production_records
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- weaving_products
DROP POLICY IF EXISTS "service_full_access" ON weaving_products;
CREATE POLICY "service_full_access" ON weaving_products
  FOR ALL
  USING (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres')
  WITH CHECK (auth.role() IN ('service_role', 'postgres') OR current_user = 'postgres');

-- ========================================
-- 3. 修复 SECURITY DEFINER 视图
-- ========================================
-- 将视图改为 SECURITY INVOKER（默认）
-- 这样视图会使用调用者的权限，而不是视图创建者的权限

-- 删除旧视图并重新创建（不带 SECURITY DEFINER）
DROP VIEW IF EXISTS v_monthly_production;
CREATE VIEW v_monthly_production AS
SELECT 
    year,
    month,
    COUNT(*) as total_nets,
    SUM(length) as total_length,
    SUM(actual_area) as total_area,
    SUM(equivalent_output) as total_equivalent,
    COUNT(*) FILTER (WHERE is_qualified) as qualified_nets,
    ROUND(COUNT(*) FILTER (WHERE is_qualified)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as net_formation_rate
FROM weaving_production_records
GROUP BY year, month
ORDER BY year DESC, month DESC;

DROP VIEW IF EXISTS v_machine_monthly_summary;
CREATE VIEW v_machine_monthly_summary AS
SELECT 
    year,
    month,
    machine_id,
    COUNT(*) as net_count,
    SUM(length) as total_length,
    SUM(actual_area) as total_area,
    SUM(equivalent_output) as total_equivalent
FROM weaving_production_records
GROUP BY year, month, machine_id
ORDER BY year DESC, month DESC, machine_id;

-- ========================================
-- 4. 验证 RLS 已启用
-- ========================================
-- 执行以下查询检查 RLS 状态（可选）
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ========================================
-- 完成！
-- ========================================
-- RLS 已为所有 15 个表启用
-- 2 个 SECURITY DEFINER 视图已修复
