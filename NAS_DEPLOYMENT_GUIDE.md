# NAS 部署指南 - PDF 字段提取应用

## 📋 目录
1. [系统要求](#系统要求)
2. [准备工作](#准备工作)
3. [部署步骤](#部署步骤)
4. [配置优化](#配置优化)
5. [访问方式](#访问方式)
6. [常见问题](#常见问题)

---

## 🖥️ 系统要求

### 硬件要求
- **CPU**: 双核及以上
- **内存**: 至少 2GB（推荐 4GB）
- **存储**: 至少 10GB 可用空间

### 软件要求
- **操作系统**: Linux（Synology DSM、QNAP QTS、Ubuntu 等）
- **Node.js**: 24.x 或更高版本
- **Python**: 3.12
- **pnpm**: 包管理器

---

## 📦 准备工作

### 第一步：SSH 连接到 NAS

```bash
# Windows 用户使用 PowerShell 或 Git Bash
ssh user@your-nas-ip

# 示例
ssh admin@192.168.1.100

# 输入 NAS 登录密码
```

### 第二步：检查系统环境

```bash
# 检查操作系统
cat /etc/os-release

# 检查 CPU 架构
uname -m
# 输出 x86_64 表示支持，输出 aarch64/arm64 需要使用 ARM 版本
```

### 第三步：安装 Node.js（如果未安装）

#### Synology NAS（使用 Docker）
```bash
# 在 Synology Docker 中拉取 Node.js 镜像
# 或者使用套件中心的 Node.js 套件（如果可用）
```

#### QNAP NAS
```bash
# 使用 QNAP App Center 中的 Node.js 套件
# 或手动安装
```

#### 通用 Linux 系统
```bash
# 使用 NodeSource 仓库安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 第四步：安装 Python 3.12

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev

# 验证安装
python3.12 --version
```

#### Synology NAS
```bash
# 使用套件中心的 Python 3 套件
# 或使用 Docker 容器
```

### 第五步：安装 pnpm

```bash
# 使用 npm 全局安装
npm install -g pnpm

# 验证安装
pnpm -v
```

---

## 🚀 部署步骤

### 方案一：直接部署（推荐用于测试）

#### 步骤 1：创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /opt/pdf-extractor
cd /opt/pdf-extractor

# 创建必要的子目录
mkdir -p /tmp/pdfs /tmp/extracted logs
```

#### 步骤 2：上传项目文件

从当前环境下载项目文件，然后上传到 NAS：

**方法 A：使用 scp（推荐）**
```bash
# 在本地电脑上执行
cd /workspace/projects

# 压缩项目文件
tar -czf pdf-extractor.tar.gz \
  src/ \
  public/ \
  projects/ \
  .coze \
  package.json \
  pnpm-lock.yaml \
  tsconfig.json \
  next.config.mjs \
  tailwind.config.ts \
  postcss.config.mjs \
  components.json

# 上传到 NAS
scp pdf-extractor.tar.gz user@your-nas-ip:/opt/pdf-extractor/

# 在 NAS 上解压
cd /opt/pdf-extractor
tar -xzf pdf-extractor.tar.gz
rm pdf-extractor.tar.gz
```

**方法 B：使用 Git**
```bash
# 如果项目已推送到 Git 仓库
cd /opt/pdf-extractor
git clone your-repo-url .
```

#### 步骤 3：安装依赖

```bash
cd /opt/pdf-extractor

# 安装 Node.js 依赖
pnpm install

# 创建 Python 虚拟环境
python3.12 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装 Python 依赖
pip install PyMuPDF==1.23.26 openpyxl==3.1.5

# 退出虚拟环境
deactivate
```

#### 步骤 4：测试运行

```bash
# 开发模式测试
cd /opt/pdf-extractor
pnpm run dev

# 打开浏览器访问 http://your-nas-ip:5000
# 测试上传 PDF 功能

# 按 Ctrl+C 停止
```

#### 步骤 5：生产部署

```bash
# 构建生产版本
cd /opt/pdf-extractor
pnpm run build

# 启动生产服务
pnpm run start

# 服务将在 5000 端口运行
```

---

### 方案二：Docker 部署（推荐用于生产）

#### 步骤 1：创建 Dockerfile

在 NAS 上创建 `/opt/pdf-extractor/Dockerfile`：

```dockerfile
FROM node:24-bookworm

# 安装 Python 3.12 和必要工具
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装 Node.js 依赖
RUN pnpm install

# 复制项目文件
COPY . .

# 创建 Python 虚拟环境并安装依赖
RUN python3.12 -m venv venv && \
    . venv/bin/activate && \
    pip install PyMuPDF==1.23.26 openpyxl==3.1.5

# 创建必要的目录
RUN mkdir -p /tmp/pdfs /tmp/extracted

# 构建 Next.js 应用
RUN pnpm run build

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000 || exit 1

# 启动应用
CMD ["pnpm", "run", "start"]
```

#### 步骤 2：创建 .dockerignore 文件

```dockerfile
node_modules
.next
.git
.gitignore
*.md
.env.local
```

#### 步骤 3：构建 Docker 镜像

```bash
cd /opt/pdf-extractor

# 构建镜像
docker build -t pdf-extractor:latest .

# 查看镜像
docker images | grep pdf-extractor
```

#### 步骤 4：运行 Docker 容器

```bash
# 运行容器
docker run -d \
  --name pdf-extractor \
  -p 5000:5000 \
  -v /tmp/pdfs:/tmp/pdfs \
  -v /tmp/extracted:/tmp/extracted \
  --restart unless-stopped \
  pdf-extractor:latest

# 查看容器状态
docker ps | grep pdf-extractor

# 查看日志
docker logs -f pdf-extractor
```

#### 步骤 5：管理容器

```bash
# 停止容器
docker stop pdf-extractor

# 启动容器
docker start pdf-extractor

# 重启容器
docker restart pdf-extractor

# 删除容器
docker stop pdf-extractor
docker rm pdf-extractor

# 删除镜像
docker rmi pdf-extractor:latest
```

---

### 方案三：使用 Docker Compose（推荐）

#### 步骤 1：创建 docker-compose.yml

```yaml
version: '3.8'

services:
  pdf-extractor:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pdf-extractor
    ports:
      - "5000:5000"
    volumes:
      - /tmp/pdfs:/tmp/pdfs
      - /tmp/extracted:/tmp/extracted
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - TZ=Asia/Shanghai
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 步骤 2：启动服务

```bash
cd /opt/pdf-extractor

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

---

## ⚙️ 配置优化

### 1. 设置开机自启（systemd）

创建服务文件 `/etc/systemd/system/pdf-extractor.service`：

```ini
[Unit]
Description=PDF Field Extractor Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/pdf-extractor
Environment="NODE_ENV=production"
Environment="TZ=Asia/Shanghai"
ExecStart=/usr/local/bin/pnpm run start
Restart=always
RestartSec=10
StandardOutput=append:/opt/pdf-extractor/logs/app.log
StandardError=append:/opt/pdf-extractor/logs/error.log

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable pdf-extractor

# 启动服务
sudo systemctl start pdf-extractor

# 查看状态
sudo systemctl status pdf-extractor

# 查看日志
sudo journalctl -u pdf-extractor -f
```

### 2. 配置 Nginx 反向代理（可选）

如果 NAS 上已安装 Nginx，配置反向代理：

创建配置文件 `/etc/nginx/sites-available/pdf-extractor`：

```nginx
server {
    listen 80;
    server_name your-nas-domain.com;  # 替换为你的域名或 NAS IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:5000;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/pdf-extractor /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 3. 配置 HTTPS（可选）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-nas-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 设置防火墙

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # 如果不使用反向代理
sudo ufw enable

# 查看 UFW 状态
sudo ufw status
```

---

## 🌐 访问方式

### 1. 局域网访问
- **直接访问**：`http://192.168.1.100:5000`（替换为你的 NAS IP）
- **反向代理**：`http://your-nas-domain.com`

### 2. 外网访问

#### 方案 A：端口转发（路由器配置）
1. 登录路由器管理后台
2. 找到"端口转发"或"虚拟服务器"设置
3. 添加规则：
   - 外部端口：自定义（如 8000）
   - 内部 IP：NAS IP
   - 内部端口：5000
4. 访问：`http://your-public-ip:8000`

#### 方案 B：DDNS（动态域名）
1. 注册 DDNS 服务（如 No-IP、DuckDNS）
2. 在路由器或 NAS 上配置 DDNS
3. 访问：`http://your-ddns-domain.com:8000`

#### 方案 C：frp 内网穿透（推荐）
参考 [frp 官方文档](https://github.com/fatedier/frp)

---

## 🔧 常见问题

### Q1: Node.js 版本不兼容
```bash
# 使用 nvm 管理多个 Node 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
```

### Q2: Python 依赖安装失败
```bash
# 升级 pip
python3.12 -m pip install --upgrade pip

# 使用国内镜像源
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple PyMuPDF==1.23.26
```

### Q3: 端口被占用
```bash
# 查看端口占用
sudo lsof -i:5000

# 或
sudo netstat -tulpn | grep 5000

# 修改端口
# 编辑 next.config.mjs 或 .coze 文件
```

### Q4: 权限问题
```bash
# 修改项目目录权限
sudo chown -R $USER:$USER /opt/pdf-extractor

# 修改临时目录权限
sudo chmod -R 755 /tmp/pdfs /tmp/extracted
```

### Q5: 内存不足
```bash
# 增加 Node.js 内存限制
# 编辑启动命令
NODE_OPTIONS="--max-old-space-size=2048" pnpm run start
```

### Q6: 查看日志
```bash
# 直接部署
tail -f /opt/pdf-extractor/logs/app.log

# Docker 部署
docker logs -f pdf-extractor

# systemd 服务
sudo journalctl -u pdf-extractor -f
```

### Q7: 更新应用
```bash
# 停止服务
sudo systemctl stop pdf-extractor

# 备份旧版本
sudo cp -r /opt/pdf-extractor /opt/pdf-extractor.backup

# 上传新文件
# （使用 scp 或 git pull）

# 重新安装依赖
cd /opt/pdf-extractor
pnpm install
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 重新构建
pnpm run build

# 启动服务
sudo systemctl start pdf-extractor
```

---

## 📊 监控与维护

### 1. 资源监控
```bash
# CPU 和内存使用
htop

# 磁盘使用
df -h

# 查看进程
ps aux | grep node
```

### 2. 定期清理
```bash
# 清理临时文件
sudo rm -rf /tmp/pdfs/*
sudo rm -rf /tmp/extracted/*

# 清理 Docker 镜像（如果使用 Docker）
docker system prune -a
```

### 3. 备份策略
```bash
# 备份配置文件
tar -czf pdf-extractor-config-backup.tar.gz \
  /opt/pdf-extractor/.coze \
  /opt/pdf-extractor/package.json \
  /opt/pdf-extractor/tsconfig.json

# 备份数据（如果有）
tar -czf pdf-extractor-data-backup.tar.gz /tmp/extracted/
```

---

## 🎯 快速检查清单

部署完成后，请检查以下项目：

- [ ] 服务正常启动（5000 端口可访问）
- [ ] 可以成功上传 PDF 文件
- [ ] 字段提取功能正常
- [ ] Excel 文件可以正常下载
- [ ] 开机自启已配置
- [ ] 日志记录正常
- [ ] 外网访问已配置（如需要）
- [ ] HTTPS 已启用（如需要）

---

## 📞 技术支持

如遇到问题，请提供以下信息：
1. NAS 型号和系统版本
2. Node.js 和 Python 版本
3. 错误日志
4. 操作步骤

---

**部署完成后，访问 `http://your-nas-ip:5000` 开始使用！**
