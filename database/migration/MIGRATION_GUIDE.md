# 鹤山积分管理系统 - 数据库迁移指南

## 概述

本文档提供从 Supabase 迁移到标准 PostgreSQL 的完整指南。

### 迁移目标

- **源数据库**: Supabase PostgreSQL (托管服务)
- **目标数据库**: 标准 PostgreSQL 14+ (自托管或其他云服务)
- **迁移难度**: ⭐⭐ (低-中等)

### 为什么可以迁移？

1. ✅ **核心数据访问已使用标准 PostgreSQL**
   - 后端使用 `pg` (node-postgres) 库直接 SQL 连接
   - 未使用 Supabase 客户端 SDK 进行核心操作

2. ✅ **未使用 Supabase 特有服务**
   - ❌ Supabase Auth (使用自建 PIN 码认证)
   - ❌ Realtime (无实时订阅)
   - ❌ Storage (无文件存储)
   - ❌ Edge Functions (无边缘函数)

3. ⚠️ **需要调整的部分**
   - RLS 策略使用了 `auth.role()` 函数 (Supabase 特有)
   - 需要更新 `DATABASE_URL` 环境变量

---

## 迁移文件清单

| 文件 | 用途 |
|------|------|
| `migration-full.sql` | 完整数据库结构脚本（表、索引、触发器、视图） |
| `migration-export-data.sql` | 数据导出脚本（生成 INSERT 语句） |
| `MIGRATION_GUIDE.md` | 本迁移指南 |

---

## 迁移步骤

### 第一步：准备目标数据库

1. **创建 PostgreSQL 数据库**
   
   推荐云服务提供商：
   - AWS RDS PostgreSQL
   - DigitalOcean Managed PostgreSQL
   - Google Cloud SQL
   - Azure Database for PostgreSQL
   - 自建 PostgreSQL 服务器

2. **创建数据库和用户**

   ```sql
   -- 以超级用户身份连接后执行
   CREATE DATABASE heshan_hr;
   CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE heshan_hr TO app_user;
   ```

3. **记录连接信息**

   ```
   DATABASE_URL=postgresql://app_user:your_secure_password@hostname:5432/heshan_hr
   ```

---

### 第二步：导出 Supabase 数据

#### 方法 A：使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入项目 → Settings → Database
3. 复制 Connection String (Session Pooler)
4. 使用 psql 或 DBeaver 连接
5. 执行 `migration-export-data.sql` 生成 INSERT 语句

#### 方法 B：使用 pg_dump（大数据量）

```bash
# 设置连接信息
export PGHOST=aws-1-ap-southeast-2.pooler.supabase.com
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres.nihciliplwxvviaoemyf
export PGPASSWORD=your_password

# 导出数据
pg_dump --data-only --no-owner --no-acl \
  -t workshops -t employees -t system_users -t settings \
  -t monthly_data -t weaving_* -t audit_logs -t login_history \
  > supabase_data_backup.sql
```

#### 方法 C：使用 CSV 导出

在 psql 中执行：

```sql
\copy workshops TO 'workshops.csv' WITH CSV HEADER;
\copy employees TO 'employees.csv' WITH CSV HEADER;
\copy system_users TO 'system_users.csv' WITH CSV HEADER;
\copy settings TO 'settings.csv' WITH CSV HEADER;
\copy monthly_data TO 'monthly_data.csv' WITH CSV HEADER;
\copy weaving_employees TO 'weaving_employees.csv' WITH CSV HEADER;
\copy weaving_machines TO 'weaving_machines.csv' WITH CSV HEADER;
\copy weaving_products TO 'weaving_products.csv' WITH CSV HEADER;
\copy weaving_config TO 'weaving_config.csv' WITH CSV HEADER;
\copy weaving_production_records TO 'weaving_production_records.csv' WITH CSV HEADER;
\copy weaving_monthly_data TO 'weaving_monthly_data.csv' WITH CSV HEADER;
```

---

### 第三步：导入到目标数据库

1. **连接目标数据库**

   ```bash
   psql "postgresql://app_user:password@hostname:5432/heshan_hr"
   ```

2. **创建表结构**

   ```bash
   psql -f database/migration-full.sql "postgresql://..."
   ```

   或在 psql 中：

   ```sql
   \i /path/to/migration-full.sql
   ```

3. **导入数据**

   如果使用 INSERT 语句：
   ```bash
   psql -f exported_data.sql "postgresql://..."
   ```

   如果使用 CSV：
   ```sql
   \copy workshops FROM 'workshops.csv' WITH CSV HEADER;
   \copy employees FROM 'employees.csv' WITH CSV HEADER;
   -- ... 其他表
   ```

4. **重置序列值**（如果使用 CSV 导入）

   ```sql
   SELECT setval('weaving_production_records_id_seq', 
     (SELECT MAX(id) FROM weaving_production_records));
   SELECT setval('weaving_monthly_data_id_seq', 
     (SELECT MAX(id) FROM weaving_monthly_data));
   SELECT setval('audit_logs_id_seq', 
     (SELECT MAX(id) FROM audit_logs));
   SELECT setval('login_history_id_seq', 
     (SELECT MAX(id) FROM login_history));
   ```

---

### 第四步：更新应用配置

1. **更新后端环境变量**

   编辑 `.env.server` 文件：

   ```env
   # 旧配置（注释掉）
   # DATABASE_URL=postgresql://postgres.nihciliplwxvviaoemyf:xxx@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
   
   # 新配置
   DATABASE_URL=postgresql://app_user:password@your-new-host:5432/heshan_hr
   ```

2. **更新生产环境变量**

   - Zeabur：在控制面板 → 环境变量中更新 `DATABASE_URL`
   - 其他平台：按平台文档更新环境变量

3. **移除 Supabase 客户端依赖（可选）**

   如果确认不再使用 Supabase 客户端：

   ```bash
   npm uninstall @supabase/supabase-js
   ```

   并删除 `src/services/supabaseClient.ts`

---

### 第五步：验证迁移

1. **检查数据完整性**

   ```sql
   -- 检查各表行数
   SELECT 'workshops' as table_name, COUNT(*) FROM workshops
   UNION ALL SELECT 'employees', COUNT(*) FROM employees
   UNION ALL SELECT 'system_users', COUNT(*) FROM system_users
   UNION ALL SELECT 'weaving_employees', COUNT(*) FROM weaving_employees
   UNION ALL SELECT 'weaving_machines', COUNT(*) FROM weaving_machines
   UNION ALL SELECT 'weaving_production_records', COUNT(*) FROM weaving_production_records;
   ```

2. **测试应用功能**

   ```bash
   # 启动后端
   npm run server
   
   # 测试健康检查
   curl http://localhost:3000/api/health
   # 应返回: {"connected":true,"ok":1}
   ```

3. **功能测试清单**

   - [ ] 用户登录
   - [ ] 员工列表加载
   - [ ] 生产记录查询
   - [ ] 新增生产记录（触发器自动计算）
   - [ ] 月度汇总数据

---

## 数据库架构参考

### 表结构汇总

| 表名 | 描述 | 主要用途 |
|------|------|----------|
| `workshops` | 工段/车间 | 组织架构 |
| `employees` | 定型工段员工 | 人员管理 |
| `system_users` | 系统用户 | 登录认证 |
| `settings` | 系统设置 | 公告等配置 |
| `monthly_data` | 定型月度数据 | 定型绩效 |
| `weaving_employees` | 织造工段员工 | 织造人员 |
| `weaving_machines` | 织造机台 | 设备管理 |
| `weaving_products` | 网种/产品 | 产品目录 |
| `weaving_config` | 织造配置 | 系统参数 |
| `weaving_production_records` | 生产记录 | **核心数据** |
| `weaving_monthly_summary` | 月度汇总 | 统计数据 |
| `weaving_monthly_data` | 月度核算 | 资金核算 |
| `audit_logs` | 操作日志 | 安全审计 |
| `login_history` | 登录历史 | 安全追踪 |
| `active_sessions` | 活跃会话 | 在线状态 |

### 关键触发器

| 触发器 | 表 | 功能 |
|--------|-----|------|
| `trg_calculate_equivalent` | `weaving_production_records` | 自动计算等效产量 |
| `*_update_timestamp` | 多个表 | 自动更新 `updated_at` |

### 视图

| 视图 | 用途 |
|------|------|
| `v_monthly_production` | 月度生产汇总 |
| `v_machine_monthly_summary` | 机台月度统计 |

---

## 故障排除

### 常见问题

**Q1: 连接超时**
```
Error: Connection timed out
```
- 检查防火墙是否允许 5432 端口
- 确认 PostgreSQL 监听外部地址 (`listen_addresses = '*'`)

**Q2: 权限不足**
```
Error: permission denied for table xxx
```
- 确保用户有所有表的权限：
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

**Q3: 触发器函数不存在**
```
Error: function update_timestamp() does not exist
```
- 检查是否完整执行了 `migration-full.sql`
- 重新执行触发器部分

**Q4: 序列值问题**
```
Error: duplicate key value violates unique constraint
```
- 导入数据后需要重置序列：
```sql
SELECT setval('weaving_production_records_id_seq', (SELECT MAX(id) FROM weaving_production_records));
```

---

## 回滚计划

如果迁移失败，可以快速回滚：

1. 将 `DATABASE_URL` 改回 Supabase 连接字符串
2. 重启后端服务
3. 应用将恢复使用 Supabase 数据库

---

## 联系支持

如遇迁移问题，请提供：
1. 错误日志
2. 执行的 SQL 语句
3. 数据库版本信息

---

*文档版本: 1.0*
*创建日期: 2025-12-11*
