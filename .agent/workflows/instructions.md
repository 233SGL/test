---
description: 项目开发指令与规范
---

# 开发指令

## 语言要求
- 始终用中文思考
- 始终使用中文回答

## 输出规范
- 总结要简要
- 代码注释使用中文
- ui设计按文档规范
- 有权修改远程数据库
- 根据api文档正确对接前后端

## 项目技术栈
- 前端: React + TypeScript + Vite
- 样式: TailwindCSS
- 后端: Node.js Express
- 数据库: 根据 `.env.local` 和 `.env.server` 配置

## 目录结构
- `components/` - React 组件
- `pages/` - 页面组件
- `services/` - API 服务
- `contexts/` - React Context
- `utils/` - 工具函数
- `types.ts` - 类型定义
- `docs/` - 项目文档