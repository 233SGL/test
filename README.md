<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 鹤山薪酬管理系统（React + Vite）

本项目为鹤山定型工段薪酬管理系统的前端代码，使用 React、TypeScript、Vite 与 Tailwind CSS 构建。

**当前版本：v2.5 - 前端API修复版本**
## Supabase 直连数据库（已配置完成）

本项目现在使用 Node.js 后端通过 Session Pooler 直连 Supabase Postgres 数据库。

### 架构说明
- **前端**：React + Vite（端口 5173/5174 / 动态）
- **后端**：Express + pg（端口 3000）
- **数据库**：Supabase Postgres（通过 Session Pooler 连接）

### 最新优化 (v2.5)
- ✅ 修复前端无法连接后端API的问题
- ✅ 添加Vite代理配置将`/api`请求自动转发到后端
- ✅ 优化端口处理逻辑，支持更多开发端口
- ✅ 改进错误处理和用户提示
- ✅ 更新项目依赖项到最新版本

### 初次设置步骤

1. **创建数据库表**（仅需执行一次）
   - 打开 Supabase 控制台 → SQL Editor
   - 复制 `database/init-db.sql` 的内容并执行
   - 这会创建 `employees`, `workshops`, `settings`, `system_users`, `monthly_data` 表

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
contexts/        # React上下文
pages/           # 页面组件
services/        # 服务层
config/          # 配置文件
database/        # 数据库脚本
docs/            # 项目文档
dist/            # 构建输出
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

### v2.5 (2025-12-02)
- 修复前端无法连接后端API的问题
- 添加Vite代理配置将/api请求转发到后端服务器
- 优化端口处理逻辑，支持端口5174
- 更新gitignore忽略AI编辑器配置文件
- 改进员工管理和设置页面功能
- 升级项目依赖项

### v2.0 (2025-11-XX)
- 添加系统用户管理功能
- 实现基于角色的权限控制
- 优化数据结构和API接口

### v1.1 (2025-10-XX)
- 改为会话级登录，不再持久化登录状态
- 优化UI界面和用户体验
