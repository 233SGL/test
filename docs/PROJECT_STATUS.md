# 鹤山积分管理系统 - 项目状态总结

## 📋 基本信息

| 项目 | 说明 |
|------|------|
| **项目名称** | 鹤山定型工段和织造工段积分管理系统（Heshan Points Pro） |
| **技术栈** | React + TypeScript + Vite + Tailwind CSS + Node.js + Express + Supabase PostgreSQL |
| **当前版本** | v1.3.1-体验优化与功能增强 |
| **最后更新** | 2025-12-09 |

## 📁 项目结构

```
hr/
├── components/           # React组件
│   └── weaving/         # 织造工段组件
│       ├── EquivalentOutputCalculator.tsx  # 等效产量计算器
│       ├── WeavingConfiguration.tsx        # 织造配置面板
│       ├── WeavingDataEntry.tsx            # 织造数据录入
│       └── WeavingResults.tsx              # 织造结果展示
├── config/              # 配置文件
│   └── metadata.json    # 项目元数据
├── contexts/            # React上下文
│   ├── AuthContext.tsx  # 认证上下文（登录、权限检查）
│   └── DataContext.tsx  # 数据上下文（全局数据管理）
├── database/            # 数据库脚本
│   ├── add-employees.sql    # 员工数据脚本
│   ├── init-db.sql          # 数据库初始化（定型工段）
│   └── weaving-tables.sql   # 织造工段表结构
├── docs/                # 项目文档
│   ├── API_DOCUMENTATION.md   # API文档
│   ├── PROJECT_STATUS.md      # 项目状态（本文件）
│   └── UI_UX_DESIGN_SPEC.md   # UI/UX设计规范
├── pages/               # 页面组件
│   ├── auth/            # 认证相关页面
│   │   └── Login.tsx    # 登录页
│   ├── styling/         # 定型工段页面
│   │   ├── Dashboard.tsx       # 数据大盘
│   │   ├── ProductionData.tsx  # 生产数据录入
│   │   ├── Attendance.tsx      # 每日工时
│   │   ├── SalaryCalculator.tsx # 积分计算
│   │   ├── Simulation.tsx      # 模拟沙箱
│   │   └── StylingSettings.tsx # 工段设置
│   ├── weaving/         # 织造工段页面（新增6个）
│   │   ├── Dashboard.tsx       # 织造大盘
│   │   ├── ProductionEntry.tsx # 生产录入（每张网一条记录）
│   │   ├── ProductionRecords.tsx # 生产记录查询
│   │   ├── MonthlySummary.tsx  # 月度汇总统计
│   │   ├── BonusCalculation.tsx # 奖金计算（成网率+运转率）
│   │   ├── MachineManagement.tsx # 机台管理（H1-H11）
│   │   ├── ProductManagement.tsx # 网种管理
│   │   ├── Calculator.tsx      # 积分计算器
│   │   ├── Configuration.tsx   # 工段配置
│   │   └── DataEntry.tsx       # 数据录入
│   └── system/          # 系统管理页面
│       ├── Employees.tsx  # 员工档案
│       └── Settings.tsx   # 系统设置
├── services/            # 服务层
│   ├── db.ts            # 数据库服务（API调用）
│   ├── calcService.ts   # 定型工段积分计算
│   ├── weavingCalcService.ts # 织造工段积分计算
│   ├── weavingApi.ts    # 织造工段API服务
│   └── supabaseClient.ts # Supabase客户端
├── tests/               # 测试文件
│   └── weaving.test.ts  # 织造工段测试
├── utils/               # 工具函数
│   ├── permissionHelpers.ts  # 权限转换工具
│   └── routeHelpers.ts       # 路由辅助工具
├── .env.server          # 服务器环境变量（数据库连接）
├── .gitignore           # Git忽略文件
├── App.tsx              # 应用主组件（路由配置）
├── index.tsx            # 应用入口
├── package.json         # 项目依赖和脚本
├── README.md            # 项目说明
├── server.js            # Node.js后端服务器
├── types.ts             # 通用类型定义
├── weavingTypes.ts      # 织造工段类型定义
├── vite.config.ts       # Vite配置（含API代理）
└── vitest.config.ts     # 测试配置
```

### 构建输出
- `dist/` - Vite 构建输出目录，包含生产环境静态文件

### 本地文档（不提交）
- `织造工段/` - 本地参考文档
- `*.pdf` - 考核方案等参考文件

## 📊 版本历史

### v1.3.1-体验优化与功能增强 (2025-12-09)
- ✅ **织造奖金核算增强**：支持手动录入目标产量，新增参数配置面板 (Config Modal)
- ✅ **员工管理UI重构**：全新设计的工具栏，集成搜索、排序与批量管理功能
- ✅ **文件结构清理**：移除冗余的 Dashboard 文件

### v1.3.0-织造生产管理完善 (2025-12-06)
- ✅ 修复 API 地址统一使用相对路径，通过 Vite 代理
- ✅ 修复 TypeScript 类型错误（WeavingEmployee.role → position）
- ✅ 清理未使用的导入，减少 ESLint 警告
- ✅ 优化等效产量卡片显示（单机台平均 vs 总量）
- ✅ 完善织造工段考核方案实现
  - 成网率质量奖计算
  - 运转率奖计算
  - 二次分配（班长1.3，班员1.0）
  - 单机台目标 6450㎡

### v1.2.0-织造生产管理 (2025-12-05)
| 状态管理 | React Context (AuthContext + DataContext) |
| API通信 | services/db.ts |

### 后端
| 项目 | 状态 |
|------|------|
| 技术栈 | Node.js + Express + pg |
| 状态 | ✅ 功能完整，API接口齐全 |
| 入口 | server.js |
| 数据库 | Supabase PostgreSQL (Session Pooler) |

### 数据库表结构
| 表名 | 说明 |
|------|------|
| employees | 员工信息（含 machine_id 字段） |
| workshops | 工段/车间信息 |
| settings | 系统设置 |
| system_users | 系统用户（含权限） |
| monthly_data | 月度积分数据 |

## 🚀 功能模块

### 定型工段
- ✅ 积分计算逻辑
- ✅ 生产数据录入
- ✅ 每日工时管理
- ✅ 模拟沙箱
- ✅ 工段公告

### 织造工段
- ✅ 独立的积分计算逻辑
- ✅ 等效产量计算器
- ✅ 织造数据录入
- ✅ 机台号管理（H1-H11）

### 系统管理
- ✅ 员工档案管理
- ✅ 系统用户管理
- ✅ 权限控制（新旧两套系统兼容）
- ✅ 全局设置

## 🛠️ 开发环境

```bash
# 安装依赖
npm install

# 启动开发环境（前后端同时启动）
npm start

# 仅启动后端
npm run server

# 仅启动前端
npm run dev
```

| 配置 | 说明 |
|------|------|
| 前端端口 | 5173（可通过 VITE_DEV_PORT 配置） |
| 后端端口 | 3000 |
| API代理 | Vite 将 /api 请求转发到后端 |

## 📝 后续计划

1. **织造模块数据持久化** - 织造工段配置和月度数据集成后端API
2. **性能优化** - 添加数据缓存机制
3. **移动端优化** - 完善响应式布局
4. **报表功能** - 添加更多数据可视化功能

## 📄 代码注释说明

本项目所有核心文件均包含详细的中文注释：

| 文件 | 注释内容 |
|------|---------|
| `types.ts` | 所有类型定义的详细说明 |
| `weavingTypes.ts` | 织造工段专用类型说明 |
| `App.tsx` | 路由配置和组件说明 |
| `services/db.ts` | API调用方法说明 |
| `services/calcService.ts` | 积分计算算法详解 |
| `contexts/AuthContext.tsx` | 认证相关方法说明 |
| `contexts/DataContext.tsx` | 数据管理方法说明 |
| `utils/permissionHelpers.ts` | 权限转换逻辑说明 |
| `server.js` | 后端API端点说明 |
