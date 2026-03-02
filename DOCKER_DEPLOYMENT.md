# Docker 部署详细步骤指南

## 📋 目录
1. [环境准备](#环境准备)
2. [项目文件准备](#项目文件准备)
3. [上传到 NAS](#上传到-nas)
4. [Docker 部署](#docker-部署)
5. [验证部署](#验证部署)
6. [配置外网访问](#配置外网访问)
7. [日常管理](#日常管理)
8. [故障排查](#故障排查)

---

## 🛠️ 环境准备

### 1. 检查 NAS 系统

```bash
# SSH 连接到 NAS
ssh user@your-nas-ip

# 检查操作系统
cat /etc/os-release

# 检查 CPU 架构
uname -m
# 输出 x86_64 表示支持，输出 aarch64/arm64 需要使用 ARM 版本
```

### 2. 检查 Docker 安装

```bash
# 检查 Docker 是否已安装
docker --version

# 检查 Docker Compose 是否已安装
docker-compose --version

# 如果没有 Docker Compose，安装它
# 方法 1：使用 pip
pip install docker-compose

# 方法 2：下载二进制文件
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 检查 Docker 服务状态

```bash
# 查看 Docker 服务状态
sudo systemctl status docker

# 如果 Docker 未运行，启动它
sudo systemctl start docker

# 设置开机自启
sudo systemctl enable docker

# 测试 Docker
docker run hello-world
```

---

## 📦 项目文件准备

### 方案 A：从当前环境导出（推荐）

在你的本地电脑或当前环境中执行：

#### 步骤 1：创建项目打包目录

```bash
# 进入项目目录
cd /workspace/projects

# 创建临时打包目录
mkdir -p /tmp/pdf-extractor-package
```

#### 步骤 2：复制必需文件

```bash
# 创建文件列表
cat > /tmp/file_list.txt << 'EOF'
src/
public/
projects/
.coze
package.json
pnpm-lock.yaml
tsconfig.json
next.config.mjs
tailwind.config.ts
postcss.config.mjs
components.json
requirements.txt
Dockerfile
docker-compose.yml
EOF

# 复制文件到打包目录
while IFS= read -r file; do
  if [ -e "$file" ]; then
    cp -r "$file" /tmp/pdf-extractor-package/
    echo "已复制: $file"
  else
    echo "警告: $file 不存在，跳过"
  fi
done < /tmp/file_list.txt
```

#### 步骤 3：创建压缩包

```bash
# 创建压缩包
cd /tmp
tar -czf pdf-extractor.tar.gz pdf-extractor-package/

# 查看压缩包大小
ls -lh pdf-extractor.tar.gz
```

### 方案 B：手动打包（备选）

```bash
cd /workspace/projects

# 创建压缩包（包含所有必需文件）
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
  components.json \
  requirements.txt \
  Dockerfile \
  docker-compose.yml

# 验证压缩包
tar -tzf pdf-extractor.tar.gz | head -20
```

---

## 📤 上传到 NAS

### 方法 1：使用 scp（推荐）

#### 在你的本地电脑上执行：

```bash
# 将压缩包上传到 NAS
scp /tmp/pdf-extractor.tar.gz user@your-nas-ip:/tmp/

# 示例
scp /tmp/pdf-extractor.tar.gz admin@192.168.1.100:/tmp/
```

### 方法 2：使用 SFTP 客户端（图形界面）

使用 FileZilla、WinSCP 等 SFTP 客户端：
- 主机：NAS IP 地址
- 用户名：NAS 登录用户
- 密码：NAS 登录密码
- 端口：22
- 将 `pdf-extractor.tar.gz` 上传到 `/tmp/` 目录

### 方法 3：使用 rsync

```bash
# 使用 rsync 同步文件（适合增量更新）
rsync -avz --progress \
  /workspace/projects/ \
  user@your-nas-ip:/opt/pdf-extractor/
```

---

## 🐳 Docker 部署

### 步骤 1：SSH 连接到 NAS

```bash
ssh user@your-nas-ip

# 输入密码登录
```

### 步骤 2：创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /opt/pdf-extractor

# 创建临时文件目录
sudo mkdir -p /tmp/pdfs
sudo mkdir -p /tmp/extracted

# 设置权限
sudo chmod 755 /opt/pdf-extractor
sudo chmod 755 /tmp/pdfs
sudo chmod 755 /tmp/extracted
```

### 步骤 3：解压项目文件

```bash
# 解压到项目目录
cd /opt
sudo tar -xzf /tmp/pdf-extractor.tar.gz

# 重命名目录（如果需要）
sudo mv pdf-extractor-package pdf-extractor

# 进入项目目录
cd /opt/pdf-extractor

# 查看文件列表
ls -la
```

**期望看到的文件列表：**
```
Dockerfile
docker-compose.yml
package.json
pnpm-lock.yaml
requirements.txt
src/
public/
projects/
.coze
tsconfig.json
next.config.mjs
tailwind.config.ts
postcss.config.mjs
components.json
```

### 步骤 4：检查配置文件

```bash
# 查看并验证 docker-compose.yml
cat docker-compose.yml

# 查看 Dockerfile
cat Dockerfile
```

### 步骤 5：修改配置（可选）

如果需要自定义端口或资源限制，编辑 `docker-compose.yml`：

```bash
sudo nano docker-compose.yml
```

可修改的配置：
- 端口映射：`ports: - "5000:5000"` → `ports: - "8080:5000"`
- 内存限制：`memory: 2G` → `memory: 1G`
- CPU 限制：`cpus: '2.0'` → `cpus: '1.0'`

### 步骤 6：构建 Docker 镜像

```bash
cd /opt/pdf-extractor

# 使用 Docker Compose 构建
docker-compose build

# 这会执行以下操作：
# 1. 下载基础镜像（node:24-bookworm）
# 2. 安装 Python 3.12
# 3. 安装 Node.js 依赖
# 4. 安装 Python 依赖
# 5. 构建 Next.js 应用

# 构建过程可能需要 10-20 分钟，请耐心等待
```

**构建过程中会看到的输出：**
```
[+] Building 123.4s (xx/xx) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => [internal] load metadata for docker.io/library/node:24-bookworm
 => [internal] load build context
 => => transferring context: 12.34MB
 => [1/10] FROM docker.io/library/node:24-bookworm
 => [2/10] RUN apt-get update && apt-get install -y ...
 => [3/10] WORKDIR /app
 => [4/10] COPY package.json pnpm-lock.yaml* ./
 => [5/10] RUN npm install -g pnpm
 => [6/10] RUN pnpm install
 => [7/10] COPY . .
 => [8/10] RUN python3.12 -m venv venv && pip install ...
 => [9/10] RUN pnpm run build
 => [10/10] HEALTHCHECK ...
 => exporting to image
 => => exporting layers
 => => writing image sha256:xxx
 => => naming to docker.io/library/pdf-extractor-pdf-extractor
```

### 步骤 7：启动容器

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 输出示例：
# Creating network "pdf-extractor_default" ... done
# Creating pdf-extractor ... done
```

**命令说明：**
- `up`：启动服务
- `-d`：后台运行（detached mode）

### 步骤 8：查看容器状态

```bash
# 查看运行中的容器
docker ps

# 应该看到类似输出：
# CONTAINER ID   IMAGE                    COMMAND                  CREATED         STATUS         PORTS                    NAMES
# abc123def456   pdf-extractor-pdf-extractor   "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   0.0.0.0:5000->5000/tcp   pdf-extractor

# 查看容器详细信息
docker inspect pdf-extractor
```

### 步骤 9：查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 只看特定服务的日志
docker-compose logs -f pdf-extractor
```

**期望看到的日志输出：**
```
pdf-extractor    | ▲ Next.js 16.x.x
pdf-extractor    |   - Local:        http://localhost:5000
pdf-extractor    |   - Network:      http://0.0.0.0:5000
pdf-extractor    |
pdf-extractor    | ✓ Ready in x.xx seconds
```

---

## ✅ 验证部署

### 1. 检查容器状态

```bash
# 检查容器是否运行
docker ps | grep pdf-extractor

# 检查容器健康状态
docker inspect pdf-extractor | grep -A 10 Health
```

### 2. 测试本地访问

```bash
# 在 NAS 上测试
curl -I http://localhost:5000

# 期望输出：
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8
# ...
```

### 3. 测试局域网访问

在你的电脑浏览器中打开：
```
http://your-nas-ip:5000
```

例如：`http://192.168.1.100:5000`

**你应该看到：**
- PDF 字段提取应用的主界面
- 上传按钮和说明文字

### 4. 功能测试

#### 测试 1：上传 PDF 文件

1. 准备一个 PDF 文件
2. 点击"上传文件"按钮
3. 选择 PDF 文件
4. 观察文件上传进度

#### 测试 2：字段提取

1. 等待文件处理完成
2. 查看提取的字段是否正确
3. 检查字段值是否准确

#### 测试 3：Excel 下载

1. 上传多个 PDF 文件
2. 等待所有文件处理完成
3. 点击"下载全局 Excel"按钮
4. 下载 Excel 文件
5. 打开 Excel 验证数据

### 5. 检查生成的文件

```bash
# 检查临时 PDF 文件
ls -lh /tmp/pdfs/

# 检查 Excel 文件
ls -lh /tmp/extracted/

# 查看全局 Excel 文件
ls -lh /tmp/extracted/all_data.xlsx
```

---

## 🌐 配置外网访问

### 方案 1：路由器端口转发（最简单）

#### 步骤 1：登录路由器管理后台

在浏览器中打开：
```
http://192.168.1.1  （通常是路由器的默认 IP）
```

#### 步骤 2：找到端口转发设置

不同路由器的设置位置不同，常见路径：
- **TP-Link**：高级功能 → NAT 转发 → 虚拟服务器
- **华为**：更多功能 → 安全设置 → 端口映射
- **小米**：常用设置 → 端口转发
- **ASUS**：外部网络（WAN） → 端口转发

#### 步骤 3：添加端口转发规则

填写以下信息：
- **服务名称**：PDF Extractor
- **外部端口**：8000（或你想要的任何端口）
- **内部 IP**：NAS 的 IP 地址（如 192.168.1.100）
- **内部端口**：5000
- **协议**：TCP

保存配置。

#### 步骤 4：获取公网 IP

```bash
# 查看公网 IP
curl ifconfig.me

# 或在浏览器访问：https://www.whatismyip.com/
```

#### 步骤 5：外网访问

在浏览器中打开：
```
http://your-public-ip:8000
```

例如：`http://123.45.67.89:8000`

### 方案 2：使用 DDNS（推荐）

#### 步骤 1：注册 DDNS 服务

推荐免费的 DDNS 服务商：
- DuckDNS（https://www.duckdns.org）
- No-IP（https://www.noip.com）
- dnspod

#### 步骤 2：配置 DDNS

在 NAS 或路由器上配置 DDNS：
- 输入 DDNS 账号信息
- 输入域名（如 mynas.duckdns.org）

#### 步骤 3：配置端口转发

同方案 1，配置端口转发规则。

#### 步骤 4：外网访问

在浏览器中打开：
```
http://mynas.duckdns.org:8000
```

### 方案 3：使用内网穿透（frp）

#### 在服务器端（有公网 IP 的 VPS）

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -xzf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 编辑配置文件
cat > frps.ini << 'EOF'
[common]
bind_port = 7000
vhost_http_port = 8080
EOF

# 启动 frps
./frps -c frps.ini
```

#### 在 NAS 上（客户端）

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -xzf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 编辑配置文件
cat > frpc.ini << 'EOF'
[common]
server_addr = your-vps-ip
server_port = 7000

[web]
type = http
local_ip = 127.0.0.1
local_port = 5000
custom_domains = your-domain.com
EOF

# 启动 frpc
./frpc -c frpc.ini
```

### 方案 4：配置 HTTPS（可选）

#### 使用 Nginx 反向代理 + Let's Encrypt

```bash
# 安装 Nginx 和 Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 配置 Nginx
sudo nano /etc/nginx/sites-available/pdf-extractor
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

启用配置并获取证书：

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/pdf-extractor /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 证书会自动续期
```

现在可以通过 HTTPS 访问：
```
https://your-domain.com
```

---

## 🔧 日常管理

### 启动和停止服务

```bash
# 进入项目目录
cd /opt/pdf-extractor

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps
```

### 查看日志

```bash
# 实时查看日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定时间的日志
docker-compose logs --since="2024-01-01T00:00:00"

# 只查看错误日志
docker-compose logs | grep -i error
```

### 更新应用

```bash
cd /opt/pdf-extractor

# 1. 停止服务
docker-compose down

# 2. 备份当前版本
sudo cp -r /opt/pdf-extractor /opt/pdf-extractor.backup.$(date +%Y%m%d)

# 3. 上传新文件
# 使用 scp 或其他方式上传新的项目文件

# 4. 重新构建镜像
docker-compose build --no-cache

# 5. 启动服务
docker-compose up -d

# 6. 查看日志确认正常
docker-compose logs -f
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a

# 查看磁盘使用情况
docker system df
```

### 监控资源使用

```bash
# 查看容器资源使用情况
docker stats pdf-extractor

# 查看容器详细信息
docker inspect pdf-extractor | less

# 查看容器进程
docker exec pdf-extractor ps aux

# 进入容器内部
docker exec -it pdf-extractor /bin/bash

# 查看容器文件系统
docker exec pdf-extractor ls -la /app
```

### 数据备份

```bash
# 备份配置文件
sudo tar -czf pdf-extractor-config-backup.tar.gz \
  /opt/pdf-extractor/docker-compose.yml \
  /opt/pdf-extractor/Dockerfile \
  /opt/pdf-extractor/.coze

# 备份数据（Excel 文件等）
sudo tar -czf pdf-extractor-data-backup.tar.gz /tmp/extracted/

# 传输备份文件到安全位置
scp pdf-extractor-*backup*.tar.gz user@backup-server:/backups/
```

---

## 🔍 故障排查

### 问题 1：容器无法启动

**症状**：`docker-compose up -d` 后容器立即退出

**排查步骤**：

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs

# 查看详细日志
docker logs pdf-extractor

# 常见原因：
# 1. 端口被占用
sudo lsof -i:5000

# 2. 内存不足
free -h

# 3. 磁盘空间不足
df -h
```

**解决方案**：

```bash
# 1. 修改端口（编辑 docker-compose.yml）
# ports:
#   - "8080:5000"

# 2. 增加内存限制
# deploy:
#   resources:
#     limits:
#       memory: 4G

# 3. 清理磁盘空间
docker system prune -a
```

### 问题 2：无法访问应用

**症状**：浏览器显示"无法访问此网站"

**排查步骤**：

```bash
# 1. 检查容器是否运行
docker ps | grep pdf-extractor

# 2. 检查端口是否监听
sudo netstat -tulpn | grep 5000

# 3. 在 NAS 本地测试
curl http://localhost:5000

# 4. 检查防火墙
sudo ufw status

# 5. 检查 NAS 防火墙设置
# （根据你的 NAS 品牌，在管理界面检查）
```

**解决方案**：

```bash
# 1. 启动容器
docker-compose up -d

# 2. 开放防火墙端口
sudo ufw allow 5000/tcp

# 3. 检查 NAS 防火墙设置
# （在 NAS 管理界面开放 5000 端口）
```

### 问题 3：PDF 解析失败

**症状**：上传 PDF 后显示"解析失败"

**排查步骤**：

```bash
# 查看容器日志
docker-compose logs | grep -i error

# 检查临时目录权限
ls -la /tmp/pdfs
ls -la /tmp/extracted

# 进入容器检查
docker exec -it pdf-extractor /bin/bash
ls -la /tmp/pdfs
ls -la /tmp/extracted
exit
```

**解决方案**：

```bash
# 修复权限
sudo chmod 755 /tmp/pdfs
sudo chmod 755 /tmp/extracted

# 重启容器
docker-compose restart
```

### 问题 4：LLM 提取失败

**症状**：字段提取返回空值或错误

**排查步骤**：

```bash
# 查看日志
docker-compose logs | grep -i llm

# 检查网络连接
docker exec pdf-extractor ping -c 3 api.coze.cn

# 检查 API 密钥配置
docker exec pdf-extractor env | grep COZE
```

**解决方案**：

```bash
# 1. 检查网络连接
# 确保 NAS 可以访问互联网

# 2. 配置代理（如果需要）
# 在 docker-compose.yml 中添加：
# environment:
#   - HTTP_PROXY=http://proxy-server:port
#   - HTTPS_PROXY=http://proxy-server:port

# 3. 重启容器
docker-compose restart
```

### 问题 5：内存不足

**症状**：容器被系统 OOM Killer 杀死

**排查步骤**：

```bash
# 查看系统内存
free -h

# 查看容器内存使用
docker stats pdf-extractor

# 查看系统日志
sudo dmesg | grep -i oom
```

**解决方案**：

```bash
# 1. 增加内存限制（编辑 docker-compose.yml）
# deploy:
#   resources:
#     limits:
#       memory: 4G
#     reservations:
#       memory: 1G

# 2. 重启容器
docker-compose down
docker-compose up -d

# 3. 增加系统 Swap
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 问题 6：磁盘空间不足

**症状**：容器运行缓慢，无法上传文件

**排查步骤**：

```bash
# 查看磁盘使用
df -h

# 查看 Docker 占用
docker system df

# 查看大文件
sudo du -sh /tmp/* | sort -rh | head -10
```

**解决方案**：

```bash
# 1. 清理 Docker 资源
docker system prune -a

# 2. 清理临时文件
sudo rm -rf /tmp/pdfs/*
sudo rm -rf /tmp/extracted/*

# 3. 扩展磁盘空间
# （根据你的 NAS 配置）
```

---

## 📊 性能优化

### 1. 调整资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  pdf-extractor:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2.0'        # 最大使用 2 个 CPU 核心
          memory: 2G         # 最大使用 2GB 内存
        reservations:
          cpus: '0.5'        # 保留 0.5 个 CPU 核心
          memory: 512M       # 保留 512MB 内存
```

### 2. 优化 Node.js 内存

编辑 `.coze` 文件或 `docker-compose.yml`：

```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
```

### 3. 启用缓存

编辑 `docker-compose.yml`：

```yaml
volumes:
  - /tmp/pdfs:/tmp/pdfs
  - /tmp/extracted:/tmp/extracted
  - cache-data:/app/.next/cache
```

### 4. 使用多阶段构建（优化镜像大小）

编辑 `Dockerfile`：

```dockerfile
FROM node:24-bookworm as builder

# 安装构建依赖
RUN apt-get update && apt-get install -y python3.12 python3.12-venv

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN python3.12 -m venv venv && \
    . venv/bin/activate && \
    pip install PyMuPDF==1.23.26 openpyxl==3.1.5 && \
    pnpm run build

# 运行阶段
FROM node:24-slim

RUN apt-get update && apt-get install -y \
    python3.12 python3.12-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/projects ./projects
COPY --from=builder /app/.coze ./.coze

EXPOSE 5000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
```

---

## 📝 部署检查清单

部署完成后，请确认以下项目：

### 基础检查
- [ ] Docker 服务正常运行
- [ ] 容器成功启动
- [ ] 端口 5000 可访问
- [ ] 可以打开应用页面

### 功能检查
- [ ] 可以成功上传 PDF 文件
- [ ] PDF 文件正常解析
- [ ] 字段提取准确
- [ ] Excel 文件可以下载
- [ ] 历史记录功能正常
- [ ] 下载按钮状态正确

### 性能检查
- [ ] 应用响应速度正常
- [ ] 内存使用合理
- [ ] CPU 使用正常
- [ ] 磁盘空间充足

### 安全检查
- [ ] 防火墙配置正确
- [ ] 外网访问已配置（如需要）
- [ ] HTTPS 已启用（推荐）
- [ ] 数据定期备份

---

## 🎯 部署完成！

恭喜！你已经成功将 PDF 字段提取应用部署到 NAS 上！

### 访问地址
- **局域网访问**：`http://192.168.1.100:5000`
- **外网访问**：`http://your-public-ip:8000`（已配置端口转发）

### 管理命令
```bash
cd /opt/pdf-extractor

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down
```

### 文档位置
- 部署指南：`/opt/pdf-extractor/DOCKER_DEPLOYMENT.md`
- 项目文档：`/opt/pdf-extractor/README.md`

---

**遇到问题？**
1. 查看"故障排查"章节
2. 查看容器日志：`docker-compose logs -f`
3. 检查系统资源：`free -h`、`df -h`
4. 提供以下信息寻求帮助：
   - NAS 型号和系统版本
   - Docker 版本
   - 错误日志
   - 操作步骤

**祝你使用愉快！** 🚀
