-- ========================================
-- 鹤山积分管理系统 - 数据导出脚本
-- ========================================
-- 目的: 从 Supabase 导出现有数据
-- 使用: 在 Supabase SQL Editor 或通过 psql 客户端执行
-- ========================================

-- ========================================
-- 第一部分: 导出为 INSERT 语句（小数据量推荐）
-- ========================================

-- 导出工段数据
SELECT 'INSERT INTO workshops (id, name, code, departments) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(name) || ', ' ||
       quote_literal(code) || ', ' ||
       quote_literal(departments::text) || '::jsonb) ON CONFLICT (id) DO NOTHING;'
FROM workshops;

-- 导出员工数据
SELECT 'INSERT INTO employees (id, name, gender, workshop_id, department, position, join_date, standard_base_score, status, phone, expected_daily_hours, machine_id, base_salary, coefficient) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(name) || ', ' ||
       quote_nullable(gender) || ', ' ||
       quote_nullable(workshop_id) || ', ' ||
       quote_nullable(department) || ', ' ||
       quote_nullable(position) || ', ' ||
       COALESCE(quote_literal(join_date::text), 'NULL') || ', ' ||
       COALESCE(standard_base_score::text, '0') || ', ' ||
       quote_literal(status) || ', ' ||
       quote_nullable(phone) || ', ' ||
       COALESCE(expected_daily_hours::text, '12') || ', ' ||
       quote_nullable(machine_id) || ', ' ||
       COALESCE(base_salary::text, '0') || ', ' ||
       COALESCE(coefficient::text, '1.0') || ') ON CONFLICT (id) DO NOTHING;'
FROM employees;

-- 导出系统用户（注意：包含PIN码，请妥善保管）
SELECT 'INSERT INTO system_users (id, username, display_name, role, custom_role_name, pin_code, is_system, scopes, permissions) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(username) || ', ' ||
       quote_literal(display_name) || ', ' ||
       quote_literal(role) || ', ' ||
       quote_nullable(custom_role_name) || ', ' ||
       quote_literal(pin_code) || ', ' ||
       is_system::text || ', ' ||
       quote_literal(COALESCE(scopes::text, '[]')) || '::jsonb, ' ||
       quote_literal(COALESCE(permissions::text, '[]')) || '::jsonb) ON CONFLICT (id) DO NOTHING;'
FROM system_users;

-- 导出设置
SELECT 'INSERT INTO settings (id, announcement) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_nullable(announcement) || ') ON CONFLICT (id) DO NOTHING;'
FROM settings;

-- 导出月度数据
SELECT 'INSERT INTO monthly_data (year, month, data) VALUES (' ||
       year || ', ' ||
       month || ', ' ||
       quote_literal(data::text) || '::jsonb) ON CONFLICT (year, month) DO NOTHING;'
FROM monthly_data;

-- 导出织造员工
SELECT 'INSERT INTO weaving_employees (id, name, gender, position, coefficient, join_date, phone, status, notes, machine_id, team) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(name) || ', ' ||
       quote_nullable(gender) || ', ' ||
       quote_literal(position) || ', ' ||
       COALESCE(coefficient::text, '1.0') || ', ' ||
       COALESCE(quote_literal(join_date::text), 'NULL') || ', ' ||
       quote_nullable(phone) || ', ' ||
       quote_literal(status) || ', ' ||
       quote_nullable(notes) || ', ' ||
       quote_nullable(machine_id) || ', ' ||
       quote_nullable(team) || ') ON CONFLICT (id) DO NOTHING;'
FROM weaving_employees;

-- 导出织造机台
SELECT 'INSERT INTO weaving_machines (id, name, speed_type, width, effective_width, speed_weft_per_min, target_output, status) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(name) || ', ' ||
       quote_literal(speed_type) || ', ' ||
       width || ', ' ||
       COALESCE(effective_width::text, '7.7') || ', ' ||
       COALESCE(speed_weft_per_min::text, '41') || ', ' ||
       target_output || ', ' ||
       quote_literal(status) || ') ON CONFLICT (id) DO NOTHING;'
FROM weaving_machines;

-- 导出产品
SELECT 'INSERT INTO weaving_products (id, name, weft_density, description, is_active) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(name) || ', ' ||
       weft_density || ', ' ||
       quote_nullable(description) || ', ' ||
       is_active::text || ') ON CONFLICT (id) DO NOTHING;'
FROM weaving_products;

-- 导出织造配置
SELECT 'INSERT INTO weaving_config (id, net_formation_benchmark, operation_rate_benchmark, target_equivalent_output, operator_quota, avg_target_bonus, admin_team_size, operation_rate_bonus_unit, leader_coef, member_coef, leader_base_salary, member_base_salary) VALUES (' ||
       quote_literal(id) || ', ' ||
       net_formation_benchmark || ', ' ||
       operation_rate_benchmark || ', ' ||
       target_equivalent_output || ', ' ||
       operator_quota || ', ' ||
       avg_target_bonus || ', ' ||
       admin_team_size || ', ' ||
       operation_rate_bonus_unit || ', ' ||
       leader_coef || ', ' ||
       member_coef || ', ' ||
       leader_base_salary || ', ' ||
       member_base_salary || ') ON CONFLICT (id) DO UPDATE SET 
         net_formation_benchmark = EXCLUDED.net_formation_benchmark,
         operation_rate_benchmark = EXCLUDED.operation_rate_benchmark,
         target_equivalent_output = EXCLUDED.target_equivalent_output;'
FROM weaving_config;

-- 导出生产记录（核心数据）
SELECT 'INSERT INTO weaving_production_records (year, month, production_date, machine_id, product_id, length, quality_grade, is_qualified, notes) VALUES (' ||
       year || ', ' ||
       month || ', ' ||
       quote_literal(production_date::text) || ', ' ||
       quote_literal(machine_id) || ', ' ||
       quote_nullable(product_id) || ', ' ||
       length || ', ' ||
       quote_literal(COALESCE(quality_grade, 'A')) || ', ' ||
       COALESCE(is_qualified::text, 'true') || ', ' ||
       quote_nullable(notes) || ');'
FROM weaving_production_records
ORDER BY year, month, id;

-- 导出月度核算数据
SELECT 'INSERT INTO weaving_monthly_data (year, month, total_area, equivalent_output, total_nets, qualified_nets, total_bonus, per_sqm_bonus, admin_team_bonus, is_confirmed, confirmed_at, confirmed_by, notes) VALUES (' ||
       year || ', ' ||
       month || ', ' ||
       COALESCE(total_area::text, '0') || ', ' ||
       COALESCE(equivalent_output::text, '0') || ', ' ||
       COALESCE(total_nets::text, '0') || ', ' ||
       COALESCE(qualified_nets::text, '0') || ', ' ||
       COALESCE(total_bonus::text, '0') || ', ' ||
       COALESCE(per_sqm_bonus::text, '0') || ', ' ||
       COALESCE(admin_team_bonus::text, '0') || ', ' ||
       is_confirmed::text || ', ' ||
       COALESCE(quote_literal(confirmed_at::text), 'NULL') || ', ' ||
       quote_nullable(confirmed_by) || ', ' ||
       quote_nullable(notes) || ') ON CONFLICT (year, month) DO NOTHING;'
FROM weaving_monthly_data;

-- ========================================
-- 第二部分: CSV 导出命令（大数据量推荐）
-- ========================================
-- 在 psql 中执行以下命令导出为 CSV：

-- \copy workshops TO 'workshops.csv' WITH CSV HEADER;
-- \copy employees TO 'employees.csv' WITH CSV HEADER;
-- \copy system_users TO 'system_users.csv' WITH CSV HEADER;
-- \copy settings TO 'settings.csv' WITH CSV HEADER;
-- \copy monthly_data TO 'monthly_data.csv' WITH CSV HEADER;
-- \copy weaving_employees TO 'weaving_employees.csv' WITH CSV HEADER;
-- \copy weaving_machines TO 'weaving_machines.csv' WITH CSV HEADER;
-- \copy weaving_products TO 'weaving_products.csv' WITH CSV HEADER;
-- \copy weaving_config TO 'weaving_config.csv' WITH CSV HEADER;
-- \copy weaving_production_records TO 'weaving_production_records.csv' WITH CSV HEADER;
-- \copy weaving_monthly_data TO 'weaving_monthly_data.csv' WITH CSV HEADER;
-- \copy audit_logs TO 'audit_logs.csv' WITH CSV HEADER;
-- \copy login_history TO 'login_history.csv' WITH CSV HEADER;

-- ========================================
-- 辅助函数: quote_nullable
-- ========================================
-- 如果函数不存在，先创建它
CREATE OR REPLACE FUNCTION quote_nullable(text)
RETURNS text AS $$
BEGIN
    IF $1 IS NULL THEN
        RETURN 'NULL';
    ELSE
        RETURN quote_literal($1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 完成！
-- ========================================
