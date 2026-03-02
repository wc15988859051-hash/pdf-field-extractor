# 多阶段构建 Dockerfile
# 用于在极空间 Docker 上部署 PDF 字段提取应用

# 阶段 1: Node.js 构建阶段
FROM node:20-alpine AS node-builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 阶段 2: Python 环境设置
FROM node:20-alpine

# 安装 Python 3.12 和必要工具
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git

# 设置 Python 别名
RUN ln -sf /usr/bin/python3 /usr/bin/python

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=node-builder /app/.next ./.next
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/package.json ./package.json
COPY --from=node-builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 复制 Python 脚本和依赖
COPY requirements.txt ./requirements.txt
COPY projects/pdf-field-extractor ./projects/pdf-field-extractor

# 安装 Python 依赖
RUN pip3 install --no-cache-dir -r requirements.txt

# 确保必要的目录存在
RUN mkdir -p /tmp/pdfs /tmp/extracted

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["pnpm", "start"]
