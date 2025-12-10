# ========================================
# 鹤山积分管理系统 - Dockerfile
# ========================================
# 用于 Zeabur/云平台部署的 Node.js 全栈应用

# 阶段 1: 构建前端
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# ========================================
# 阶段 2: 运行时
# ========================================
FROM node:22-alpine AS runtime

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 复制后端代码
COPY server.js ./
COPY .env.server ./

# 从构建阶段复制前端产物
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 暴露端口
EXPOSE 8080

# 启动后端服务器
CMD ["node", "server.js"]
