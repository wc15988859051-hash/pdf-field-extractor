# ==============================================
# PDF 字段提取应用 - Dockerfile
# 用于极空间 NAS Docker 部署
# ==============================================

# 使用官方 Node.js 24 + Python 3.12 基础镜像
FROM node:24-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建 Python 虚拟环境
RUN python3 -m venv /app/venv

# 设置 Python 虚拟环境路径
ENV PATH="/app/venv/bin:$PATH"

# 复制项目依赖文件
COPY package.json pnpm-lock.yaml* ./
COPY requirements.txt ./

# 升级 pip 并安装 Python 依赖
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 安装 pnpm
RUN npm install -g pnpm@9

# 安装 Node.js 依赖
RUN pnpm install --frozen-lockfile

# 复制项目源代码
COPY . .

# 构建 Next.js 应用
RUN pnpm run build

# 暴露应用端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# 创建临时数据目录（用于存放 PDF 和 Excel 文件）
RUN mkdir -p /tmp/pdfs /tmp/extracted

# 启动应用
CMD ["pnpm", "start"]
