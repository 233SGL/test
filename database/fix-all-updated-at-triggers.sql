-- ========================================
-- 修复所有表的 updated_at 触发器
-- ========================================
-- 执行位置: Supabase SQL Editor
-- 用途: 确保所有有 updated_at 字段的表在更新时自动更新时间戳
-- ========================================

-- 第一步：创建通用的时间戳更新函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 基础表触发器
-- ========================================

-- 工段表
DROP TRIGGER IF EXISTS update_workshops_timestamp ON workshops;
CREATE TRIGGER update_workshops_timestamp
    BEFORE UPDATE ON workshops
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 定型员工表
DROP TRIGGER IF EXISTS update_employees_timestamp ON employees;
CREATE TRIGGER update_employees_timestamp
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 系统用户表
DROP TRIGGER IF EXISTS update_system_users_timestamp ON system_users;
CREATE TRIGGER update_system_users_timestamp
    BEFORE UPDATE ON system_users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 系统设置表
DROP TRIGGER IF EXISTS update_settings_timestamp ON settings;
CREATE TRIGGER update_settings_timestamp
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 定型月度数据表
DROP TRIGGER IF EXISTS update_monthly_data_timestamp ON monthly_data;
CREATE TRIGGER update_monthly_data_timestamp
    BEFORE UPDATE ON monthly_data
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 织造工段表触发器
-- ========================================

-- 织造员工表
DROP TRIGGER IF EXISTS weaving_employees_update_timestamp ON weaving_employees;
CREATE TRIGGER weaving_employees_update_timestamp
    BEFORE UPDATE ON weaving_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 织造机台表
DROP TRIGGER IF EXISTS update_weaving_machines_timestamp ON weaving_machines;
CREATE TRIGGER update_weaving_machines_timestamp
    BEFORE UPDATE ON weaving_machines
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 织造配置表
DROP TRIGGER IF EXISTS update_weaving_config_timestamp ON weaving_config;
CREATE TRIGGER update_weaving_config_timestamp
    BEFORE UPDATE ON weaving_config
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 织造月度汇总表
DROP TRIGGER IF EXISTS update_weaving_monthly_summary_timestamp ON weaving_monthly_summary;
CREATE TRIGGER update_weaving_monthly_summary_timestamp
    BEFORE UPDATE ON weaving_monthly_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 织造月度核算数据表
DROP TRIGGER IF EXISTS update_weaving_monthly_data_timestamp ON weaving_monthly_data;
CREATE TRIGGER update_weaving_monthly_data_timestamp
    BEFORE UPDATE ON weaving_monthly_data
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 验证触发器是否创建成功
-- ========================================
SELECT 
    trigger_name,
    event_object_table AS table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%timestamp%'
ORDER BY event_object_table;

-- ========================================
-- 完成！
-- ========================================
-- 执行后所有表的 updated_at 字段会在数据更新时自动刷新
-- ========================================
