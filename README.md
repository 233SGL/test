# 鹤山薪酬管理系统（React + Vite）

本项目为鹤山定型工段和织造工段薪酬管理系统的前端代码，使用 React、TypeScript、Vite 与 Tailwind CSS 构建。

**当前版本：v1.3.1-体验优化与功能增强**

## Supabase 直连数据库（已配置完成）

本项目现在使用 Node.js 后端通过 Session Pooler 直连 Supabase Postgres 数据库。

### 架构说明
- **前端**：React + Vite（端口 5173）
- **后端**：Express + pg（端口 3000）
- **数据库**：Supabase Postgres（通过 Session Pooler 连接）
- **API代理**：Vite 将 `/api` 请求转发到后端

### 最新优化 (v1.3.1)
- ✅ **织造奖金核算增强**：支持手动录入目标产量，新增参数配置面板 (Config Modal)
- ✅ **员工管理UI重构**：全新设计的工具栏，集成搜索、排序与批量管理功能
- ✅ **文件结构清理**：移除冗余的 Dashboard 文件
- ✅ 修复 API 统一使用相对路径，通过 Vite 代理转发
- ✅ 完善织造工段考核方案实现（成网率奖 + 运转率奖）

### 初次设置步骤

1. **创建数据库表**（仅需执行一次）
   - 打开 Supabase 控制台 → SQL Editor
   - 复制 `database/init-db.sql` 的内容并执行
   - 复制 `database/weaving-tables.sql` 的内容并执行（织造工段表）
   - 这会创建 `employees`, `workshops`, `settings`, `system_users`, `monthly_data` 表
   - `employees` 表包含 `machine_id` 字段用于织造工段机台管理（H1-H11）

2. **安装依赖**
   ```bat
   npm install
   ```

3. **启动应用**
   ```bat
   npm start
   ```
   这会同时启动后端服务器（3000端口）和前端开发服务器（默认 5173，可通过 `VITE_DEV_PORT` 指定）

   或者分别启动：
   ```bat
   npm run server  # 仅后端（3000端口）
   npm run dev     # 仅前端（使用 vite.config.ts 中的端口，默认 5173）
   ```

4. **访问应用**
   打开浏览器访问 Vite 输出的 `Local:` 地址（默认 `http://localhost:5173`，若端口被占用会提示新的端口）
   
5. **故障排查**
   - 如果前端无法连接后端API，请检查vite.config.ts中的代理配置
   - 确认后端服务在3000端口正常运行
   - 验证API健康检查：`curl http://localhost:3000/api/health`

### 环境配置

后端配置在 `.env.server`（已配置，包含数据库连接信息）：
```
DATABASE_URL=postgresql://postgres.nihciliplwxvviaoemyf:LQYGiWHwOTDVf5CL@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
PORT=3000
```

前端调用的 API 地址默认会根据当前页面自动推断：
- 如果运行在 `localhost:5173 / 4173 / 3001 / 5174` 等开发端口，会自动指向 `http://localhost:3000/api`
- 如果使用生产环境或自定义端口，则默认指向与前端同源的 `/api`
- Vite配置了代理，将所有`/api`请求自动转发到后端服务器（3000端口）

若需要覆盖默认行为，可在根目录创建 `.env` 或 `.env.local` 添加：
```
VITE_API_BASE=https://your-domain.com/api
```

### API 端点

后端提供以下 REST API：
- `GET /api/health` - 健康检查
- `GET /api/employees` - 获取所有员工
- `POST /api/employees` - 创建员工
- `PUT /api/employees/:id` - 更新员工
- `GET /api/workshops` - 获取车间
- `GET /api/settings` - 获取设置
- `PUT /api/settings` - 更新设置
- `GET /api/users` - 获取系统用户
- `GET /api/monthly-data/:year/:month` - 获取月度数据
- `POST /api/monthly-data` - 保存月度数据

### 测试连接

```bat
curl http://localhost:3000/api/health
```
应返回：`{"connected":true,"ok":true}`

### 注意事项
- `.env.server` 包含数据库密码，不要提交到 Git
- 前端通过动态 `API_BASE` 调用后端（默认指向 `http://localhost:3000/api`，也可通过 `VITE_API_BASE` 覆盖）
- 数据库密码只存在后端，前端看不到

**前置条件：** 安装 Node.js（建议 LTS）。

1. 安装依赖：
   `npm install`
2. 启动开发环境：
   `npm run dev`

访问终端输出的本地地址即可使用。

## 重要说明（登录策略）

从 v1.1 起，登录状态不再持久化到浏览器存储，刷新或重新打开页面需要重新登录（会话级）。

## 技术栈

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS（PostCSS 构建，无 CDN）

## 目录结构

```
components/      # React组件
  ├── weaving/   # 织造工段专用组件
contexts/        # React上下文
pages/           # 页面组件
  ├── auth/      # 认证页面
  ├── styling/   # 定型工段页面
  ├── weaving/   # 织造工段页面
  ├── admin/     # 后台管理页面 (新增)
  └── system/    # 系统管理页面
services/        # 服务层
config/          # 配置文件
database/        # 数据库脚本
docs/            # 项目文档
dist/            # 构建输出
weavingTypes.ts  # 织造工段类型定义
types.ts         # 通用类型定义
```

## 部署说明

### 开发环境部署
开发环境已配置好前后端分离和API代理，按照上述步骤启动即可。

### 生产环境部署建议

1. **构建前端**
   ```bat
   npm run build
   ```
   构建产物在 `dist` 目录

2. **后端配置**
   - 修改 `.env.server` 中的数据库连接为生产环境
   - 确保生产环境的Supabase表结构与开发环境一致

3. **部署选项**
   - **静态托管**: 使用Nginx等Web服务器托管前端静态文件，配置反向代理将`/api`转发到后端
   - **容器化部署**: 使用Docker将前后端打包为容器，使用docker-compose编排
   - **云服务器**: 部署到腾讯云、阿里云等，使用PM2管理Node.js进程

### 腾讯云部署
系统支持通过腾讯云服务进行部署：
- **静态网站托管**: 前端可部署到腾讯云静态网站托管
- **云服务器**: 后端服务可部署到腾讯云轻量应用服务器
- **云数据库**: 数据库可使用腾讯云PostgreSQL或继续使用Supabase

## 文档

详见 `docs/API_DOCUMENTATION.md` 获取 API 与类型说明。

## 更新日志

### v1.3.1-体验优化与功能增强 (2025-12-09)
**织造奖金核算与UI交互升级**
- ✅ **成网率奖金核算优化**
  - 支持“目标产量”手动录入，灵活应对特殊生产情况
  - 新增全局参数配置功能（齿轮图标），可实时调整考核基准与系数
- ✅ **员工管理体验升级**
  - 重构顶部工具栏，视觉风格更统一
  - 优化搜索框样式，集成按日期/姓名排序功能
  - 新增“批量管理”模式，支持批量选择与离职操作
- ✅ **系统维护**
  - 删除冗余的 `Dashboard.tsx`，理清文件结构
- ✅ **后台管理模块 (新增)**
  - 新增审计日志 (Audit Logs) 页面，记录关键操作
  - 新增数据库查看器 (Database Viewer)，方便开发调试

### v1.3.0-织造生产管理完善 (2025-12-06)
**API 优化与代码质量提升**
- ✅ 修复 API 地址统一使用相对路径 `/api`，通过 Vite 代理转发
- ✅ 修复 TypeScript 类型错误（WeavingEmployee.role → position）
- ✅ 清理未使用的导入，减少 ESLint 警告
- ✅ 优化等效产量卡片显示（单机台平均 vs 总量）
- ✅ 完善织造工段考核方案实现
  - 成网率质量奖：(成网率-68%)×100÷30×产量率×人效
  - 运转率奖：(运转率-72%)×100×500
  - 二次分配：班长系数1.3，班员系数1.0
  - 单机台目标 6450㎡

### v1.2.0-织造生产管理 (2025-12-05)
**织造工段生产记录管理完善**
- ✅ 新增织造工段 6 个管理页面
  - 生产录入：每张网录入一条记录
  - 生产记录：按月查看和删除记录
  - 月度汇总：统计当月生产数据
  - 奖金计算：成网率/运转率奖金计算
  - 机台管理：11台机台状态监控与属性配置
  - 网种管理：产品纬密配置
- ✅ 机台排序优化
  - 机台按数字顺序排列 (1, 2, 3, ... 11)
- ✅ 员工管理优化
  - 织造员工职位下拉选择（机台管理员班长/机台管理员）
  - 选择职位自动填充基本工资和系数
  - 机台管理员班长：基本工资 3500，系数 1.3
  - 机台管理员：基本工资 2500，系数 1.0
- ✅ 权限系统扩展
  - 添加织造工段专有页面权限类型
  - 支持工段级别权限控制

### v1.1.0-织造模块 (2025-12-03)
**织造工段功能上线**
- ✅ 添加织造工段完整功能模块
  - 织造工段专用数据结构 (weavingTypes.ts)
  - 等效产量计算器组件
  - 织造工段大盘、数据录入、薪酬计算、配置管理页面
- ✅ 修复工段计算隔离问题
  - 在 DataContext 中过滤织造员工，确保定型工段计算独立
- ✅ 整合织造人员档案到系统员工管理
  - 支持织造工段机台号管理 (H1-H11)

### v2.5 (2025-12-02)
- 修复前端无法连接后端API的问题
- 添加Vite代理配置将/api请求转发到后端服务器

### v2.0 (2025-11)
- 添加系统用户管理功能
- 实现基于角色的权限控制

### v1.1 (2025-11)
- 改为会话级登录，不再持久化登录状态
- 优化UI界面和用户体验
