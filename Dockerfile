# 多阶段构建 Dockerfile
# Stage 1: 构建阶段
FROM node:24-bookworm-slim AS builder

# 安装 Python 3.12 和构建依赖
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3.12-pip \
    python3.12-dev \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# 设置 Python 别名
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/pip3 pip3 /usr/bin/pip3.12 1 \
    && update-alternatives --install /usr/bin/pip pip /usr/bin/pip3.12 1

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 安装 Python 依赖
RUN pip3 install --no-cache-dir \
    PyMuPDF==1.23.26 \
    openpyxl==3.1.5

# 构建应用
RUN pnpm build

# Stage 2: 运行阶段
FROM node:24-bookworm-slim AS runner

# 安装 Python 3.12（运行时需要）
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3.12-pip \
    && rm -rf /var/lib/apt/lists/*

# 设置 Python 别名
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/pip3 pip3 /usr/bin/pip3.12 1 \
    && update-alternatives --install /usr/bin/pip pip /usr/bin/pip3.12

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 安装 Python 依赖（运行时需要）
RUN pip3 install --no-cache-dir \
    PyMuPDF==1.23.26 \
    openpyxl==3.1.5

# 创建非 root 用户
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制必要的文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/projects ./projects
COPY --from=builder /app/public ./public

# 创建必要的目录
RUN mkdir -p /tmp/pdfs /tmp/extracted && \
    chown -R nodeuser:nodeuser /app /tmp

# 切换到非 root 用户
USER nodeuser

# 暴露端口
EXPOSE 5000

# 环境变量
ENV NODE_ENV=production \
    PORT=5000

# 启动应用
CMD ["node", "server.js"]
