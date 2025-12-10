-- ========================================
-- 修复 updated_at 自动更新
-- ========================================
-- 问题: 多个表有 updated_at 列但没有自动更新触发器
-- 修复: 为所有需要的表创建统一的更新时间触发器
-- ========================================

-- 创建通用的更新时间函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 为 weaving_machines 添加触发器
-- ========================================
DROP TRIGGER IF EXISTS update_weaving_machines_timestamp ON weaving_machines;
CREATE TRIGGER update_weaving_machines_timestamp
    BEFORE UPDATE ON weaving_machines
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 为 weaving_config 添加触发器
-- ========================================
DROP TRIGGER IF EXISTS update_weaving_config_timestamp ON weaving_config;
CREATE TRIGGER update_weaving_config_timestamp
    BEFORE UPDATE ON weaving_config
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 为 weaving_monthly_summary 添加触发器
-- ========================================
DROP TRIGGER IF EXISTS update_weaving_monthly_summary_timestamp ON weaving_monthly_summary;
CREATE TRIGGER update_weaving_monthly_summary_timestamp
    BEFORE UPDATE ON weaving_monthly_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 为 weaving_monthly_data 添加触发器
-- ========================================
DROP TRIGGER IF EXISTS update_weaving_monthly_data_timestamp ON weaving_monthly_data;
CREATE TRIGGER update_weaving_monthly_data_timestamp
    BEFORE UPDATE ON weaving_monthly_data
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 验证触发器创建成功
-- ========================================
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name
FROM pg_trigger 
WHERE tgname LIKE '%timestamp%'
ORDER BY table_name;
