-- ========================================
-- 修复 Supabase Security Lint: Function Search Path
-- ========================================
-- 问题: calculate_production_equivalent 函数的 search_path 可被修改
-- 风险: 攻击者可能通过设置恶意 search_path 执行代码注入
-- 修复: 显式设置 search_path 为 public
-- ========================================

-- 删除旧函数
DROP FUNCTION IF EXISTS public.calculate_production_equivalent();

-- 重新创建函数，设置安全的 search_path
CREATE OR REPLACE FUNCTION public.calculate_production_equivalent()
RETURNS TRIGGER AS $$
DECLARE
    v_machine_width NUMERIC;
    v_weft_density INTEGER;
    v_base_density INTEGER := 220;  -- 基准纬密
BEGIN
    -- 获取机台幅宽
    SELECT machine_width INTO v_machine_width
    FROM public.weaving_machines
    WHERE id = NEW.machine_id;
    
    -- 获取产品纬密
    SELECT weft_density INTO v_weft_density
    FROM public.weaving_products
    WHERE id = NEW.product_id;
    
    -- 使用默认值防止空值
    v_machine_width := COALESCE(v_machine_width, 3.6);
    v_weft_density := COALESCE(v_weft_density, 220);
    
    -- 计算实际面积 = 长度 × 幅宽
    NEW.actual_area := NEW.length * v_machine_width;
    
    -- 计算等效产量 = 实际面积 × (纬密 / 基准纬密)
    NEW.equivalent_output := NEW.actual_area * (v_weft_density::NUMERIC / v_base_density);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY INVOKER  -- 使用调用者权限，更安全
   SET search_path = public;  -- 显式设置 search_path 防止注入

-- 添加注释说明
COMMENT ON FUNCTION public.calculate_production_equivalent() IS 
'触发器函数：自动计算生产记录的实际面积和等效产量。已设置安全的 search_path。';

-- 确保触发器已绑定到表
DROP TRIGGER IF EXISTS trg_calculate_equivalent ON public.weaving_production_records;

CREATE TRIGGER trg_calculate_equivalent
    BEFORE INSERT OR UPDATE ON public.weaving_production_records
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_production_equivalent();
