<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 薪酬管理系统（React + Vite）

本项目为鹤山定型工段薪酬管理系统的前端代码，使用 React、TypeScript、Vite 与 Tailwind CSS 构建。

## 本地运行

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

## 目录结构（部分）

```
components/      // UI 组件
contexts/        // Auth/Data 上下文
pages/           // 页面视图
services/        // 计算与数据服务
```

## 文档

详见 `API_DOCUMENTATION.md` 获取 API 与类型说明。
