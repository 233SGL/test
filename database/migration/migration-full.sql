-- ========================================
-- 鹤山积分管理系统 - 完整数据库迁移脚本
-- ========================================
-- 目标: 从 Supabase 迁移到标准 PostgreSQL
-- 版本: 1.0
-- 创建时间: 2025-12-11
-- 
-- 使用说明:
-- 1. 在目标 PostgreSQL 数据库中执行此脚本
-- 2. 脚本包含: 表结构、索引、触发器、视图、初始数据
-- 3. 不包含 Supabase 特有功能 (RLS, auth.role() 等)
-- ========================================

-- ========================================
-- 第一部分: 清理旧结构（可选）
-- ========================================
-- 警告: 以下命令会删除所有现有数据!
-- 仅在全新安装时取消注释

-- DROP TABLE IF EXISTS weaving_production_records CASCADE;
-- DROP TABLE IF EXISTS weaving_monthly_data CASCADE;
-- DROP TABLE IF EXISTS weaving_monthly_summary CASCADE;
-- DROP TABLE IF EXISTS weaving_products CASCADE;
-- DROP TABLE IF EXISTS weaving_machines CASCADE;
-- DROP TABLE IF EXISTS weaving_employees CASCADE;
-- DROP TABLE IF EXISTS weaving_config CASCADE;
-- DROP TABLE IF EXISTS active_sessions CASCADE;
-- DROP TABLE IF EXISTS login_history CASCADE;
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS monthly_data CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS system_users CASCADE;
-- DROP TABLE IF EXISTS workshops CASCADE;

-- DROP VIEW IF EXISTS v_monthly_production CASCADE;
-- DROP VIEW IF EXISTS v_machine_monthly_summary CASCADE;

-- ========================================
-- 第二部分: 基础表结构
-- ========================================

-- 1. 工段/车间表
CREATE TABLE IF NOT EXISTS workshops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    departments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE workshops IS '工段/车间表';
COMMENT ON COLUMN workshops.departments IS '部门列表，JSON数组格式';

-- 2. 员工表（定型工段）
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    workshop_id TEXT REFERENCES workshops(id),
    department TEXT,
    position TEXT,
    join_date DATE,
    standard_base_score NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'probation', 'leave', 'terminated')),
    phone TEXT,
    expected_daily_hours NUMERIC DEFAULT 12,
    machine_id TEXT,
    base_salary NUMERIC DEFAULT 0,
    coefficient NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE employees IS '员工表（定型工段）';
COMMENT ON COLUMN employees.standard_base_score IS '标准基础分';
COMMENT ON COLUMN employees.expected_daily_hours IS '预期每日工作时长';

CREATE INDEX IF NOT EXISTS idx_employees_workshop ON employees(workshop_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- 3. 系统用户表
CREATE TABLE IF NOT EXISTS system_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    custom_role_name TEXT,
    pin_code TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,
    scopes JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE system_users IS '系统用户表';
COMMENT ON COLUMN system_users.pin_code IS '登录PIN码';
COMMENT ON COLUMN system_users.scopes IS '用户工段范围权限';
COMMENT ON COLUMN system_users.permissions IS '用户功能权限列表';

CREATE INDEX IF NOT EXISTS idx_system_users_username ON system_users(username);

-- 4. 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    announcement TEXT,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE settings IS '系统全局设置表';

-- 5. 月度数据表（定型工段）
CREATE TABLE IF NOT EXISTS monthly_data (
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (year, month)
);

COMMENT ON TABLE monthly_data IS '定型工段月度数据表';

CREATE INDEX IF NOT EXISTS idx_monthly_data_year_month ON monthly_data(year, month);

-- ========================================
-- 第三部分: 后台管理表
-- ========================================

-- 6. 操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL,               -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    target_type TEXT,                   -- employee, workshop, settings, etc.
    target_id TEXT,
    target_name TEXT,
    details JSONB,                      -- 修改前后的数据对比
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS '操作审计日志表';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);

-- 7. 登录历史表
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL,               -- LOGIN, LOGOUT, LOGIN_FAILED
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE login_history IS '用户登录历史表';

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);

-- 8. 在线会话表
CREATE TABLE IF NOT EXISTS active_sessions (
    id TEXT PRIMARY KEY,                -- session token
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE active_sessions IS '用户活跃会话表（用于追踪在线状态）';

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);

-- ========================================
-- 第四部分: 织造工段表
-- ========================================

-- 9. 织造工段员工表
CREATE TABLE IF NOT EXISTS weaving_employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    position TEXT NOT NULL CHECK (position IN ('admin_leader', 'admin_member', 'operator')),
    coefficient NUMERIC DEFAULT 1.0,
    join_date DATE,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'probation', 'leave', 'terminated')),
    notes TEXT,
    machine_id TEXT,                    -- NULL=未分配, 'admin'=管理员, 'H1'-'H11'=具体机台
    team TEXT,                          -- 班组（一班、二班等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE weaving_employees IS '织造工段员工表';
COMMENT ON COLUMN weaving_employees.position IS '岗位: admin_leader=管理员班长, admin_member=管理员班员, operator=操作工';
COMMENT ON COLUMN weaving_employees.coefficient IS '分配系数（用于奖金二次分配）';

CREATE INDEX IF NOT EXISTS idx_weaving_employees_position ON weaving_employees(position);
CREATE INDEX IF NOT EXISTS idx_weaving_employees_status ON weaving_employees(status);

-- 10. 织造工段机台表
CREATE TABLE IF NOT EXISTS weaving_machines (
    id TEXT PRIMARY KEY,                -- H1-H11
    name TEXT NOT NULL,
    speed_type TEXT NOT NULL CHECK (speed_type IN ('H2', 'H5')),
    width NUMERIC NOT NULL DEFAULT 8.5,
    effective_width NUMERIC DEFAULT 7.7,
    speed_weft_per_min INTEGER DEFAULT 41,
    target_output NUMERIC NOT NULL DEFAULT 6450,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'threading', 'maintenance', 'idle')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE weaving_machines IS '织造工段机台表';
COMMENT ON COLUMN weaving_machines.width IS '织造宽度(米)';
COMMENT ON COLUMN weaving_machines.speed_type IS 'H2=高速(41纬/分,系数1.0), H5=低速(23纬/分,系数0.56)';
COMMENT ON COLUMN weaving_machines.target_output IS '月度目标产量';

-- 11. 网种/产品表
CREATE TABLE IF NOT EXISTS weaving_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    weft_density NUMERIC NOT NULL,      -- 纬密(根/厘米)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE weaving_products IS '网种/产品表';
COMMENT ON COLUMN weaving_products.weft_density IS '纬密(根/厘米)，产品固有属性';

CREATE INDEX IF NOT EXISTS idx_weaving_products_active ON weaving_products(is_active);

-- 12. 织造工段配置表
CREATE TABLE IF NOT EXISTS weaving_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    net_formation_benchmark NUMERIC DEFAULT 68,
    operation_rate_benchmark NUMERIC DEFAULT 72,
    target_equivalent_output NUMERIC DEFAULT 6450,
    operator_quota NUMERIC DEFAULT 24,
    avg_target_bonus NUMERIC DEFAULT 4000,
    admin_team_size NUMERIC DEFAULT 3,
    operation_rate_bonus_unit NUMERIC DEFAULT 500,
    leader_coef NUMERIC DEFAULT 1.3,
    member_coef NUMERIC DEFAULT 1.0,
    leader_base_salary NUMERIC DEFAULT 3500,
    member_base_salary NUMERIC DEFAULT 2500,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE weaving_config IS '织造工段配置表';

-- 13. 织造工段月度汇总表
CREATE TABLE IF NOT EXISTS weaving_monthly_summary (
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_nets INTEGER DEFAULT 0,
    total_length NUMERIC DEFAULT 0,
    total_area NUMERIC DEFAULT 0,
    equivalent_output NUMERIC DEFAULT 0,
    net_formation_rate NUMERIC,
    operation_rate NUMERIC,
    active_machines INTEGER,
    actual_operators INTEGER,
    calculation_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (year, month)
);

COMMENT ON TABLE weaving_monthly_summary IS '织造工段月度汇总表';

-- 14. 织造工段月度核算数据表
CREATE TABLE IF NOT EXISTS weaving_monthly_data (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_area NUMERIC(12,2) DEFAULT 0,
    equivalent_output NUMERIC(12,2) DEFAULT 0,
    total_nets INTEGER DEFAULT 0,
    qualified_nets INTEGER DEFAULT 0,
    total_bonus NUMERIC(12,2) DEFAULT 0,
    per_sqm_bonus NUMERIC(10,4) DEFAULT 0,
    admin_team_bonus NUMERIC(12,2) DEFAULT 0,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

COMMENT ON TABLE weaving_monthly_data IS '织造工段月度核算数据表';

CREATE INDEX IF NOT EXISTS idx_weaving_monthly_data_year_month ON weaving_monthly_data(year, month);

-- 15. 生产记录表（核心：每张网一条记录）
CREATE TABLE IF NOT EXISTS weaving_production_records (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    production_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    machine_id TEXT NOT NULL REFERENCES weaving_machines(id),
    product_id TEXT REFERENCES weaving_products(id),
    length NUMERIC NOT NULL,
    machine_width NUMERIC,
    weft_density NUMERIC,
    speed_type TEXT,
    actual_area NUMERIC,
    output_coef NUMERIC,
    width_coef NUMERIC,
    speed_coef NUMERIC,
    equivalent_output NUMERIC,
    quality_grade TEXT DEFAULT 'A',
    is_qualified BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE weaving_production_records IS '生产记录表 - 每张网一条记录';
COMMENT ON COLUMN weaving_production_records.length IS '织造长度(米)';
COMMENT ON COLUMN weaving_production_records.equivalent_output IS '等效产量 = 面积 × 产量系数 × 宽度系数 × 速度系数';

CREATE INDEX IF NOT EXISTS idx_production_date ON weaving_production_records(year, month, production_date);
CREATE INDEX IF NOT EXISTS idx_production_machine ON weaving_production_records(machine_id);

-- ========================================
-- 第五部分: 触发器函数
-- ========================================

-- 通用时间戳更新函数
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

-- 工段表时间戳触发器
DROP TRIGGER IF EXISTS update_workshops_timestamp ON workshops;
CREATE TRIGGER update_workshops_timestamp
    BEFORE UPDATE ON workshops
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 定型员工表时间戳触发器
DROP TRIGGER IF EXISTS update_employees_timestamp ON employees;
CREATE TRIGGER update_employees_timestamp
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 系统用户表时间戳触发器
DROP TRIGGER IF EXISTS update_system_users_timestamp ON system_users;
CREATE TRIGGER update_system_users_timestamp
    BEFORE UPDATE ON system_users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 系统设置表时间戳触发器
DROP TRIGGER IF EXISTS update_settings_timestamp ON settings;
CREATE TRIGGER update_settings_timestamp
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 定型月度数据表时间戳触发器
DROP TRIGGER IF EXISTS update_monthly_data_timestamp ON monthly_data;
CREATE TRIGGER update_monthly_data_timestamp
    BEFORE UPDATE ON monthly_data
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 织造工段表触发器
-- ========================================

-- 织造员工时间戳触发器
DROP TRIGGER IF EXISTS weaving_employees_update_timestamp ON weaving_employees;
CREATE TRIGGER weaving_employees_update_timestamp
    BEFORE UPDATE ON weaving_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 织造机台时间戳触发器
DROP TRIGGER IF EXISTS update_weaving_machines_timestamp ON weaving_machines;
CREATE TRIGGER update_weaving_machines_timestamp
    BEFORE UPDATE ON weaving_machines
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 织造配置时间戳触发器
DROP TRIGGER IF EXISTS update_weaving_config_timestamp ON weaving_config;
CREATE TRIGGER update_weaving_config_timestamp
    BEFORE UPDATE ON weaving_config
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 月度汇总时间戳触发器
DROP TRIGGER IF EXISTS update_weaving_monthly_summary_timestamp ON weaving_monthly_summary;
CREATE TRIGGER update_weaving_monthly_summary_timestamp
    BEFORE UPDATE ON weaving_monthly_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 月度核算时间戳触发器
DROP TRIGGER IF EXISTS update_weaving_monthly_data_timestamp ON weaving_monthly_data;
CREATE TRIGGER update_weaving_monthly_data_timestamp
    BEFORE UPDATE ON weaving_monthly_data
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 生产记录等效产量自动计算函数
CREATE OR REPLACE FUNCTION calculate_production_equivalent()
RETURNS TRIGGER AS $$
DECLARE
    v_machine_width NUMERIC;
    v_weft_density NUMERIC;
    v_speed_type TEXT;
    v_speed_coef NUMERIC;
BEGIN
    -- 从机台表获取宽度和速度类型
    SELECT width, speed_type INTO v_machine_width, v_speed_type
    FROM weaving_machines WHERE id = NEW.machine_id;
    
    -- 从产品表获取纬密
    IF NEW.product_id IS NOT NULL THEN
        SELECT weft_density INTO v_weft_density
        FROM weaving_products WHERE id = NEW.product_id;
    ELSE
        v_weft_density := COALESCE(NEW.weft_density, 13);
    END IF;
    
    -- 计算速度系数
    v_speed_coef := CASE v_speed_type WHEN 'H5' THEN 0.56 ELSE 1.0 END;
    
    -- 填充字段
    NEW.machine_width := v_machine_width;
    NEW.weft_density := v_weft_density;
    NEW.speed_type := v_speed_type;
    NEW.speed_coef := v_speed_coef;
    
    -- 计算各项系数和结果
    NEW.actual_area := NEW.length * v_machine_width;
    NEW.output_coef := v_weft_density / 13.0;
    NEW.width_coef := 8.5 / v_machine_width;
    NEW.equivalent_output := NEW.actual_area * NEW.output_coef * NEW.width_coef * v_speed_coef;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

-- 绑定等效产量计算触发器
DROP TRIGGER IF EXISTS trg_calculate_equivalent ON weaving_production_records;
CREATE TRIGGER trg_calculate_equivalent
    BEFORE INSERT OR UPDATE ON weaving_production_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_production_equivalent();

-- ========================================
-- 第六部分: 视图
-- ========================================

-- 月度生产汇总视图
CREATE OR REPLACE VIEW v_monthly_production AS
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

-- 机台月度汇总视图
CREATE OR REPLACE VIEW v_machine_monthly_summary AS
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
-- 第七部分: 初始数据
-- ========================================

-- 插入工段数据
INSERT INTO workshops (id, name, code, departments) VALUES
    ('ws_styling', '定型工段', 'styling', '["定型一车间", "定型二车间", "后整理"]'),
    ('ws_weaving', '织造工段', 'weaving', '["织造一班", "织造二班"]')
ON CONFLICT (id) DO NOTHING;

-- 插入默认设置
INSERT INTO settings (id, announcement) VALUES
    ('global', '安全生产，重在预防。进入车间请务必穿戴好劳保用品。')
ON CONFLICT (id) DO NOTHING;

-- 插入默认管理员用户
INSERT INTO system_users (id, username, display_name, role, pin_code, is_system, scopes, permissions) VALUES
    ('u1', 'admin', '系统管理员', 'ADMIN', '1234', true, '["all"]', 
     '["VIEW_DASHBOARD", "VIEW_PRODUCTION", "VIEW_ATTENDANCE", "VIEW_CALCULATOR", "VIEW_SIMULATION", "VIEW_EMPLOYEES", "EDIT_YIELD", "EDIT_UNIT_PRICE", "EDIT_KPI", "EDIT_FIXED_PACK", "EDIT_HOURS", "EDIT_BASE_SCORE", "EDIT_WEIGHTS", "APPLY_SIMULATION", "VIEW_SENSITIVE", "MANAGE_ANNOUNCEMENTS", "MANAGE_EMPLOYEES", "MANAGE_SYSTEM"]')
ON CONFLICT (id) DO NOTHING;

-- 插入织造工段默认配置
INSERT INTO weaving_config (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 插入织造机台数据
INSERT INTO weaving_machines (id, name, speed_type, width, effective_width, speed_weft_per_min, target_output, status) VALUES
    ('H1', '1号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H2', '2号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H3', '3号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H4', '4号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H5', '5号机', 'H5', 4.25, 3.85, 23, 3600, 'running'),
    ('H6', '6号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H7', '7号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H8', '8号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H9', '9号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H10', '10号机', 'H2', 8.5, 7.7, 41, 6450, 'running'),
    ('H11', '11号机', 'H2', 8.5, 7.7, 41, 6450, 'running')
ON CONFLICT (id) DO NOTHING;

-- 插入常用产品
INSERT INTO weaving_products (id, name, weft_density, description) VALUES
    ('22504', '22504标准网', 13, '基准产品，纬密13'),
    ('3616ssb-1', '3616ssb-1', 44.5, '高纬密产品'),
    ('7500', '7500网', 44.5, '高纬密产品')
ON CONFLICT (id) DO NOTHING;

-- 插入织造工段管理员
INSERT INTO weaving_employees (id, name, gender, position, coefficient, join_date, status, machine_id) VALUES
    ('w1', '耿志友', 'male', 'admin_leader', 1.3, '2020-01-01', 'active', 'admin'),
    ('w2', '赵红林', 'male', 'admin_member', 1.0, '2020-03-15', 'active', 'admin'),
    ('w3', '夏旺潮', 'male', 'admin_member', 1.0, '2021-06-01', 'active', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 完成！
-- ========================================
-- 此脚本创建了所有必要的表结构、索引、触发器和初始数据
-- 可安全在任何标准 PostgreSQL 14+ 数据库中运行
-- ========================================
