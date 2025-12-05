-- ========================================
-- 织造工段数据库表结构
-- ========================================
-- 运行此脚本在 Supabase SQL Editor 中创建织造工段相关表

-- ========================================
-- 1. 织造工段员工表
-- ========================================
CREATE TABLE IF NOT EXISTS weaving_employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    position TEXT NOT NULL CHECK (position IN ('admin_leader', 'admin_member', 'operator')),
    base_salary NUMERIC DEFAULT 0,
    coefficient NUMERIC DEFAULT 1.0,
    join_date DATE,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'probation', 'leave', 'terminated')),
    notes TEXT,
    attendance_days NUMERIC DEFAULT 0,
    -- 操作工专用字段
    machine_id TEXT,  -- 分配的机台号 (H1-H11)
    team TEXT,        -- 班组（一班、二班等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_weaving_employees_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS weaving_employees_update_timestamp ON weaving_employees;
CREATE TRIGGER weaving_employees_update_timestamp
    BEFORE UPDATE ON weaving_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_weaving_employees_timestamp();

-- ========================================
-- 2. 织造工段机台表
-- ========================================
CREATE TABLE IF NOT EXISTS weaving_machines (
    id TEXT PRIMARY KEY,  -- H1-H11
    name TEXT NOT NULL,
    speed_type TEXT NOT NULL CHECK (speed_type IN ('H2', 'H5')),
    width NUMERIC NOT NULL DEFAULT 8.5,
    target_output NUMERIC NOT NULL DEFAULT 6450,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'maintenance', 'idle')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 织造工段配置表
-- ========================================
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

-- ========================================
-- 4. 织造工段月度数据表
-- ========================================
CREATE TABLE IF NOT EXISTS weaving_monthly_data (
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    -- 基础指标
    net_formation_rate NUMERIC,      -- 成网率 (%)
    operation_rate NUMERIC,          -- 运转率 (%)
    equivalent_output NUMERIC,       -- 总等效产量 (㎡)
    active_machines INTEGER,         -- 有效机台数
    actual_operators INTEGER,        -- 实际操作工人数
    attendance_days INTEGER,         -- 出勤天数
    -- 计算结果快照
    calculation_snapshot JSONB,
    -- 机台明细数据
    machine_records JSONB,
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (year, month)
);

-- ========================================
-- 5. 织造工段机台月度产量记录表
-- ========================================
CREATE TABLE IF NOT EXISTS weaving_machine_monthly_records (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    machine_id TEXT NOT NULL REFERENCES weaving_machines(id),
    actual_output NUMERIC DEFAULT 0,     -- 实际产量 (㎡)
    weft_density NUMERIC DEFAULT 13,     -- 纬密
    machine_width NUMERIC DEFAULT 8.5,   -- 机台宽度 (m)
    speed_type TEXT DEFAULT 'H2',        -- 速度类型
    equivalent_output NUMERIC DEFAULT 0, -- 等效产量 (计算得出)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (year, month, machine_id)
);

-- ========================================
-- 初始化数据
-- ========================================

-- 插入默认配置
INSERT INTO weaving_config (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 插入机台数据
INSERT INTO weaving_machines (id, name, speed_type, width, target_output, status) VALUES
    ('H1', '1号机', 'H2', 8.5, 6450, 'running'),
    ('H2', '2号机', 'H2', 8.5, 6450, 'running'),
    ('H3', '3号机', 'H2', 8.5, 6450, 'running'),
    ('H4', '4号机', 'H2', 8.5, 6450, 'running'),
    ('H5', '5号机', 'H5', 4.25, 3600, 'running'),
    ('H6', '6号机', 'H2', 8.5, 6450, 'running'),
    ('H7', '7号机', 'H2', 8.5, 6450, 'running'),
    ('H8', '8号机', 'H2', 8.5, 6450, 'running'),
    ('H9', '9号机', 'H2', 8.5, 6450, 'running'),
    ('H10', '10号机', 'H2', 8.5, 6450, 'running'),
    ('H11', '11号机', 'H2', 8.5, 6450, 'running')
ON CONFLICT (id) DO NOTHING;

-- 插入管理员班组人员
INSERT INTO weaving_employees (id, name, gender, position, base_salary, coefficient, join_date, status) VALUES
    ('w1', '耿志友', 'male', 'admin_leader', 3500, 1.3, '2020-01-01', 'active'),
    ('w2', '赵红林', 'male', 'admin_member', 2500, 1.0, '2020-03-15', 'active'),
    ('w3', '夏旺潮', 'male', 'admin_member', 2500, 1.0, '2021-06-01', 'active')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 创建索引
-- ========================================
CREATE INDEX IF NOT EXISTS idx_weaving_employees_position ON weaving_employees(position);
CREATE INDEX IF NOT EXISTS idx_weaving_employees_status ON weaving_employees(status);
CREATE INDEX IF NOT EXISTS idx_weaving_monthly_data_date ON weaving_monthly_data(year, month);
CREATE INDEX IF NOT EXISTS idx_weaving_machine_records_date ON weaving_machine_monthly_records(year, month);

-- ========================================
-- 添加注释
-- ========================================
COMMENT ON TABLE weaving_employees IS '织造工段员工表';
COMMENT ON TABLE weaving_machines IS '织造工段机台表';
COMMENT ON TABLE weaving_config IS '织造工段配置表';
COMMENT ON TABLE weaving_monthly_data IS '织造工段月度汇总数据表';
COMMENT ON TABLE weaving_machine_monthly_records IS '织造工段机台月度产量明细表';

COMMENT ON COLUMN weaving_employees.position IS '岗位类型: admin_leader=管理员班长, admin_member=管理员班员, operator=操作工';
COMMENT ON COLUMN weaving_employees.coefficient IS '分配系数: 班长1.3, 班员1.0, 操作工0';
COMMENT ON COLUMN weaving_machines.speed_type IS '速度类型: H2=高速(系数1.0), H5=低速(系数0.56)';
