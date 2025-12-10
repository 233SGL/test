# ========================================
# 鹤山积分管理系统 - Dockerfile
# ========================================
# 用于 Zeabur/云平台部署的 Node.js 全栈应用

# 阶段 1: 构建前端
FROM node:22-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括 devDependencies 如 vite, typescript 等）
# 使用 npm install 而不是 npm ci 以确保 devDependencies 被安装
RUN npm install --include=dev

# 复制源代码
COPY . .

# 验证 vite 是否可用
RUN npx vite --version

# 构建前端
RUN npm run build

# ========================================
# 阶段 2: 运行时（精简生产镜像）
# ========================================
FROM node:22-alpine AS runtime

WORKDIR /app

# 只复制生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 复制后端代码
COPY server.js ./
COPY .env.server ./

# 从构建阶段复制前端产物
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 暴露端口
EXPOSE 8080

# 启动后端服务器
CMD ["node", "server.js"]
