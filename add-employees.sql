-- 添加剩余员工到数据库
-- 在 Supabase SQL Editor 中执行此脚本

INSERT INTO employees (id, name, gender, workshop_id, department, position, join_date, standard_base_score, status, phone, expected_daily_hours) VALUES
  ('4', '玉尚杰', 'male', 'ws_styling', '定型一车间', '操作工', '2021-11-11', 5000, 'active', '13800138004', 8),
  ('5', '董华荣', 'male', 'ws_styling', '定型二车间', '主机手', '2019-02-28', 7300, 'active', '13800138005', 12),
  ('6', '肖冬贵', 'male', 'ws_styling', '定型二车间', '操作工', '2020-08-15', 7100, 'active', '13800138006', 12),
  ('7', '郭建文', 'male', 'ws_styling', '定型二车间', '班长', '2017-09-01', 8000, 'active', '13800138007', 12),
  ('8', '陈永松', 'male', 'ws_styling', '后整理', '普工', '2022-03-01', 5500, 'active', '13800138008', 8),
  ('9', '李国辉', 'male', 'ws_styling', '后整理', '质检', '2018-12-12', 8000, 'active', '13800138009', 12)
ON CONFLICT (id) DO NOTHING;
