# 使用官方 Node.js 镜像作为基础镜像
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm@latest

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@latest

# 从 deps 阶段复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 构建应用
RUN pnpm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/projects/pdf-field-extractor ./projects/pdf-field-extractor

# 安装 Python3 和依赖
RUN apk add --no-cache python3 py3-pip
RUN pip3 install --no-cache-dir PyMuPDF==1.23.26 openpyxl==3.1.5

# 创建必要的目录
RUN mkdir -p /tmp/extracted /tmp/pdfs
RUN chown -R nextjs:nodejs /tmp

# 修改权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 5000

ENV PORT 5000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
