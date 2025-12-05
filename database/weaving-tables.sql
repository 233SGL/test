-- ========================================
-- 织造工段数据库表结构
-- ========================================
-- 运行此脚本在 Supabase SQL Editor 中创建织造工段相关表
-- 
-- 核心概念：
-- - 织机(machine): H1-H11，有固定的宽度和速度属性
-- - 网种(product): 不同纬密的产品类型
-- - 生产记录(production): 每张网一条记录，记录实际织造长度
-- - 等效产量 = 长度 × 织机宽度 × 产量系数 × 宽度系数 × 速度系数

-- ========================================
-- 1. 织造工段员工表
-- ========================================
-- 注意：织造工段不使用基础分概念，与定型工段不同
CREATE TABLE IF NOT EXISTS weaving_employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    position TEXT NOT NULL CHECK (position IN ('admin_leader', 'admin_member', 'operator')),
    coefficient NUMERIC DEFAULT 1.0,      -- 分配系数（用于奖金二次分配）
    join_date DATE,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'probation', 'leave', 'terminated')),
    notes TEXT,
    -- 机台分配: NULL=未分配, 'admin'=管理员, 'H1'-'H11'=具体机台
    machine_id TEXT,
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
-- 2. 织造工段机台表（织机属性）
-- ========================================
-- 织机的固有属性：宽度固定，速度可调但极少调
CREATE TABLE IF NOT EXISTS weaving_machines (
    id TEXT PRIMARY KEY,  -- H1-H11
    name TEXT NOT NULL,
    speed_type TEXT NOT NULL CHECK (speed_type IN ('H2', 'H5')),
    width NUMERIC NOT NULL DEFAULT 8.5,        -- 织造宽度(米)，固定属性
    effective_width NUMERIC DEFAULT 7.7,       -- 有效幅宽(米)
    speed_weft_per_min INTEGER DEFAULT 41,     -- 织机速度(纬/分钟)，H2=41, H5≈23
    target_output NUMERIC NOT NULL DEFAULT 6450,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'threading', 'maintenance', 'idle')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 网种/产品表
-- ========================================
-- 不同产品有不同的纬密
CREATE TABLE IF NOT EXISTS weaving_products (
    id TEXT PRIMARY KEY,              -- 产品编号，如 22504, 3616ssb-1
    name TEXT NOT NULL,               -- 产品名称
    weft_density NUMERIC NOT NULL,    -- 纬密(根/厘米)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. 织造工段配置表
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
-- 5. 织造工段月度汇总表
-- ========================================
-- 月度汇总数据，由生产记录自动聚合
CREATE TABLE IF NOT EXISTS weaving_monthly_summary (
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    -- 汇总指标
    total_nets INTEGER DEFAULT 0,        -- 本月完成网数
    total_length NUMERIC DEFAULT 0,      -- 总织造长度(米)
    total_area NUMERIC DEFAULT 0,        -- 总实际面积(㎡)
    equivalent_output NUMERIC DEFAULT 0, -- 总等效产量(㎡)
    net_formation_rate NUMERIC,          -- 成网率(%)
    operation_rate NUMERIC,              -- 运转率(%)
    active_machines INTEGER,             -- 有效机台数
    actual_operators INTEGER,            -- 实际操作工人数
    -- 计算结果快照
    calculation_snapshot JSONB,
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (year, month)
);

-- ========================================
-- 6. 生产记录表（核心：每张网一条记录）
-- ========================================
-- 每完成一张网，记录一次
CREATE TABLE IF NOT EXISTS weaving_production_records (
    id SERIAL PRIMARY KEY,
    -- 时间信息
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    production_date DATE NOT NULL,       -- 完成日期
    start_time TIMESTAMP WITH TIME ZONE, -- 开始织造时间
    end_time TIMESTAMP WITH TIME ZONE,   -- 结束织造时间
    -- 关联信息
    machine_id TEXT NOT NULL REFERENCES weaving_machines(id),
    product_id TEXT REFERENCES weaving_products(id),
    -- 生产数据（只需录入长度，其他自动计算）
    length NUMERIC NOT NULL,             -- 织造长度(米)，由订单决定
    -- 以下字段自动从关联表获取或计算
    machine_width NUMERIC,               -- 织机宽度(米)，从机台表获取
    weft_density NUMERIC,                -- 纬密，从产品表获取
    speed_type TEXT,                     -- 速度类型，从机台表获取
    -- 计算结果
    actual_area NUMERIC,                 -- 实际面积 = 长度 × 宽度
    output_coef NUMERIC,                 -- 产量系数 = 纬密/13
    width_coef NUMERIC,                  -- 宽度系数 = 8.5/机台宽度
    speed_coef NUMERIC,                  -- 速度系数
    equivalent_output NUMERIC,           -- 等效产量
    -- 质量信息
    quality_grade TEXT DEFAULT 'A',      -- 质量等级 A/B/C
    is_qualified BOOLEAN DEFAULT true,   -- 是否合格（计入成网率）
    -- 备注
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_production_date ON weaving_production_records(year, month, production_date);
CREATE INDEX IF NOT EXISTS idx_production_machine ON weaving_production_records(machine_id);

-- ========================================
-- 生产记录触发器：自动计算等效产量
-- ========================================
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_equivalent ON weaving_production_records;
CREATE TRIGGER trg_calculate_equivalent
    BEFORE INSERT OR UPDATE ON weaving_production_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_production_equivalent();

-- ========================================
-- 初始化数据
-- ========================================

-- 插入默认配置
INSERT INTO weaving_config (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 插入机台数据（含有效幅宽和速度）
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

-- 插入常用网种/产品
INSERT INTO weaving_products (id, name, weft_density, description) VALUES
    ('22504', '22504标准网', 13, '基准产品，纬密13'),
    ('3616ssb-1', '3616ssb-1', 44.5, '高纬密产品'),
    ('7500', '7500网', 44.5, '高纬密产品')
ON CONFLICT (id) DO NOTHING;

-- 插入管理员班组人员
INSERT INTO weaving_employees (id, name, gender, position, coefficient, join_date, status, machine_id) VALUES
    ('w1', '耿志友', 'male', 'admin_leader', 1.3, '2020-01-01', 'active', 'admin'),
    ('w2', '赵红林', 'male', 'admin_member', 1.0, '2020-03-15', 'active', 'admin'),
    ('w3', '夏旺潮', 'male', 'admin_member', 1.0, '2021-06-01', 'active', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 创建索引
-- ========================================
CREATE INDEX IF NOT EXISTS idx_weaving_employees_position ON weaving_employees(position);
CREATE INDEX IF NOT EXISTS idx_weaving_employees_status ON weaving_employees(status);
CREATE INDEX IF NOT EXISTS idx_weaving_products_active ON weaving_products(is_active);

-- ========================================
-- 添加注释
-- ========================================
COMMENT ON TABLE weaving_employees IS '织造工段员工表';
COMMENT ON TABLE weaving_machines IS '织造工段机台表 - 织机固有属性';
COMMENT ON TABLE weaving_products IS '网种/产品表 - 不同纬密的产品';
COMMENT ON TABLE weaving_config IS '织造工段配置表';
COMMENT ON TABLE weaving_monthly_summary IS '织造工段月度汇总表';
COMMENT ON TABLE weaving_production_records IS '生产记录表 - 每张网一条记录';

COMMENT ON COLUMN weaving_employees.position IS '岗位类型: admin_leader=管理员班长, admin_member=管理员班员, operator=操作工';
COMMENT ON COLUMN weaving_machines.width IS '织造宽度(米)，织机固有属性';
COMMENT ON COLUMN weaving_machines.speed_type IS '速度类型: H2=高速(41纬/分,系数1.0), H5=低速(23纬/分,系数0.56)';
COMMENT ON COLUMN weaving_products.weft_density IS '纬密(根/厘米)，产品固有属性';
COMMENT ON COLUMN weaving_production_records.length IS '织造长度(米)，由订单决定';
COMMENT ON COLUMN weaving_production_records.equivalent_output IS '等效产量 = 面积 × 产量系数 × 宽度系数 × 速度系数';

-- ========================================
-- 视图：按月汇总生产数据
-- ========================================
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

-- ========================================
-- 视图：按机台汇总月度数据
-- ========================================
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
