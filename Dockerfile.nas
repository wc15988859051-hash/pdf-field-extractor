# NAS 架构优化的 Dockerfile
# 使用多阶段构建，支持 ARM64 架构

# 构建参数
ARG NODE_VERSION=24
ARG PYTHON_VERSION=3.12

# Stage 1: 构建阶段
FROM node:${NODE_VERSION}-bookworm-slim AS builder

# 安装 Python 和构建依赖
RUN apt-get update && apt-get install -y \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-pip \
    python${PYTHON_VERSION}-dev \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置 Python 别名
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/pip3 pip3 /usr/bin/pip${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/pip pip /usr/bin/pip${PYTHON_VERSION} 1

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖（使用 npm registry 镜像加速）
RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm install --frozen-lockfile --prefer-offline

# 复制项目文件
COPY . .

# 安装 Python 依赖
RUN pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
    pip3 install --no-cache-dir \
    PyMuPDF==1.23.26 \
    openpyxl==3.1.5

# 构建应用
RUN pnpm build

# Stage 2: 运行阶段
FROM node:${NODE_VERSION}-bookworm-slim AS runner

# 安装 Python（运行时）
RUN apt-get update && apt-get install -y \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置 Python 别名
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python${PYTHON_VERSION} 1

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 安装 Python 依赖（运行时）
RUN pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
    pip3 install --no-cache-dir \
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

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000 || exit 1

# 暴露端口
EXPOSE 5000

# 环境变量
ENV NODE_ENV=production \
    PORT=5000 \
    PYTHONUNBUFFERED=1

# 启动应用
CMD ["node", "server.js"]
