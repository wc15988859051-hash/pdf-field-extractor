# Docker 部署实战步骤

## 准备工作（在当前环境）

### 步骤 1：打包项目文件

在当前环境中执行以下命令：

```bash
cd /workspace/projects

# 创建压缩包
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
ls -lh pdf-extractor.tar.gz
```

**预期输出**：
```
-rw-r--r-- 1 root root 15M xxx xx xx:xx pdf-extractor.tar.gz
```

### 步骤 2：上传到 NAS

将压缩包上传到你的 NAS（替换 `user` 和 `192.168.1.100` 为你的实际值）：

```bash
scp pdf-extractor.tar.gz user@192.168.1.100:/tmp/
```

**输入 NAS 密码后，应该看到**：
```
pdf-extractor.tar.gz                                    100%   15MB   xx.xMB/s   xx:xx
```

---

## 部署步骤（在 NAS 上）

### 步骤 3：SSH 连接到 NAS

```bash
ssh user@192.168.1.100
```

输入密码登录。

### 步骤 4：检查 Docker

```bash
# 检查 Docker 是否安装
docker --version

# 检查 Docker Compose 是否安装
docker-compose --version

# 如果没有 Docker Compose，执行以下命令安装：
sudo apt update
sudo apt install -y docker-compose
```

**预期输出**：
```
Docker version 24.x.x, build xxxxx
Docker Compose version 2.x.x
```

### 步骤 5：创建目录结构

```bash
# 创建项目目录
sudo mkdir -p /opt/pdf-extractor

# 创建临时文件目录
sudo mkdir -p /tmp/pdfs
sudo mkdir -p /tmp/extracted

# 设置权限
sudo chmod 755 /opt/pdf-extractor /tmp/pdfs /tmp/extracted
```

### 步骤 6：解压项目文件

```bash
# 解压到 /opt 目录
cd /opt
sudo tar -xzf /tmp/pdf-extractor.tar.gz

# 重命名目录（如果需要）
sudo mv pdf-extractor-package pdf-extractor

# 进入项目目录
cd /opt/pdf-extractor

# 验证文件
ls -la
```

**应该看到以下文件**：
```
total 100
drwxr-xr-x 10 root root  4096 xxx xx xx:xx .
drwxr-xr-x  3 root root  4096 xxx xx xx:xx ..
-rw-r--r--  1 root root  1234 xxx xx xx:xx .coze
-rw-r--r--  1 root root  1234 xxx xx xx:xx Dockerfile
-rw-r--r--  1 root root  1234 xxx xx xx:xx components.json
-rw-r--r--  1 root root  1234 xxx xx xx:xx docker-compose.yml
-rw-r--r--  1 root root  1234 xxx xx xx:xx next.config.mjs
-rw-r--r--  1 root root  1234 xxx xx xx:xx package.json
-rw-r--r--  1 root root  1234 xxx xx xx:xx pnpm-lock.yaml
-rw-r--r--  1 root root  1234 xxx xx xx:xx postcss.config.mjs
-rw-r--r--  1 root root  1234 xxx xx xx:xx requirements.txt
-rw-r--r--  1 root root  1234 xxx xx xx:xx tailwind.config.ts
-rw-r--r--  1 root root  1234 xxx xx xx:xx tsconfig.json
drwxr-xr-x  2 root root  4096 xxx xx xx:xx projects
drwxr-xr-x  2 root root  4096 xxx xx xx:xx public
drwxr-xr-x  3 root root  4096 xxx xx xx:xx src
```

### 步骤 7：检查配置文件

```bash
# 查看 docker-compose.yml
cat docker-compose.yml
```

**确认配置正确**（端口 5000，卷挂载正确）。

### 步骤 8：构建 Docker 镜像

```bash
cd /opt/pdf-extractor

# 构建镜像（这可能需要 10-20 分钟）
docker-compose build
```

**构建过程中的正常输出**：
```
[+] Building 500.5s (15/15) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => => transferring context: 12.34MB
 => [internal] load metadata for docker.io/library/node:24-bookworm
 => [internal] load build context
 => => transferring context: 12.34MB
 => [1/10] FROM docker.io/library/node:24-bookworm
 => [2/10] RUN apt-get update && apt-get install -y python3.12 python3.12-venv python3.12-dev build-essential
 => [3/10] WORKDIR /app
 => [4/10] COPY package.json pnpm-lock.yaml* ./
 => [5/10] RUN npm install -g pnpm
 => [6/10] RUN pnpm install
 => [7/10] COPY . .
 => [8/10] RUN python3.12 -m venv venv
 => [8/10] RUN . venv/bin/activate && pip install PyMuPDF==1.23.26 openpyxl==3.1.5
 => [9/10] RUN pnpm run build
 => [10/10] HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 CMD curl -f http://localhost:5000 || exit 1
 => exporting to image
 => => exporting layers
 => => writing image sha256:abc123def456
 => => naming to docker.io/library/pdf-extractor-pdf-extractor
```

**重要**：构建过程中会下载大量依赖，请耐心等待。

### 步骤 9：启动容器

```bash
# 启动容器（后台运行）
docker-compose up -d
```

**预期输出**：
```
[+] Running 2/2
 ✔ Network pdf-extractor_default      Created
 ✔ Container pdf-extractor           Started
```

### 步骤 10：查看容器状态

```bash
# 查看运行中的容器
docker ps
```

**应该看到**：
```
CONTAINER ID   IMAGE                              COMMAND                  CREATED         STATUS                   PORTS                    NAMES
abc123def456   pdf-extractor-pdf-extractor        "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:5000->5000/tcp   pdf-extractor
```

**注意**：STATUS 应该显示 `Up X minutes (healthy)`。

### 步骤 11：查看日志

```bash
# 查看启动日志
docker-compose logs
```

**应该看到**：
```
pdf-extractor    | ▲ Next.js 16.x.x
pdf-extractor    |   - Local:        http://localhost:5000
pdf-extractor    |   - Network:      http://0.0.0.0:5000
pdf-extractor    |
pdf-extractor    | ✓ Ready in 5.23 seconds
```

---

## 验证部署

### 步骤 12：测试本地访问

```bash
# 在 NAS 上测试
curl -I http://localhost:5000
```

**预期输出**：
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Date: xxx xxx xx xxx:xx:xx GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

### 步骤 13：测试局域网访问

在你的电脑浏览器中打开：

```
http://192.168.1.100:5000
```

**应该看到**：
- PDF 字段提取应用的主界面
- 上传按钮和说明文字
- 标题："PDF 字段提取工具"

### 步骤 14：功能测试

1. **上传 PDF 文件**
   - 点击"点击或拖拽文件到此处上传"
   - 选择一个 PDF 文件
   - 观察上传进度

2. **检查字段提取**
   - 等待文件处理完成（状态变为"已完成"）
   - 查看提取的字段是否显示

3. **下载 Excel**
   - 上传多个 PDF 文件
   - 等待所有文件处理完成
   - 点击"下载全局 Excel"按钮
   - 打开 Excel 文件验证数据

### 步骤 15：检查生成的文件

```bash
# 检查 Excel 文件是否生成
ls -lh /tmp/extracted/all_data.xlsx
```

**应该看到**：
```
-rw-r--r-- 1 root root 15K xxx xx xx:xx all_data.xlsx
```

---

## 配置外网访问（可选）

### 方案：路由器端口转发

#### 步骤 16：登录路由器

在浏览器中打开路由器管理后台：
```
http://192.168.1.1
```

#### 步骤 17：配置端口转发

找到"端口转发"或"虚拟服务器"设置，添加规则：

| 选项 | 值 |
|------|-----|
| 服务名称 | PDF Extractor |
| 外部端口 | 8000 |
| 内部 IP | 192.168.1.100（你的 NAS IP） |
| 内部端口 | 5000 |
| 协议 | TCP |

保存配置。

#### 步骤 18：获取公网 IP

```bash
# 查看公网 IP
curl ifconfig.me
```

记下返回的 IP 地址，例如：`123.45.67.89`

#### 步骤 19：测试外网访问

在你的电脑浏览器中打开（使用手机流量测试）：

```
http://123.45.67.89:8000
```

**应该能够访问应用**。

---

## 日常管理命令

### 启动和停止

```bash
cd /opt/pdf-extractor

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 查看日志

```bash
# 实时查看日志
docker-compose logs -f

# 查看最近 100 行
docker-compose logs --tail=100
```

### 查看状态

```bash
# 查看容器状态
docker ps

# 查看资源使用
docker stats pdf-extractor
```

### 清理临时文件

```bash
# 清理 PDF 临时文件
sudo rm -rf /tmp/pdfs/*

# 清理 Excel 临时文件（谨慎操作！）
# sudo rm -rf /tmp/extracted/*
```

---

## 故障排查

### 问题 1：容器无法启动

**症状**：`docker-compose ps` 显示容器不在运行中

**解决方法**：
```bash
# 查看日志
docker-compose logs

# 检查端口占用
sudo lsof -i:5000

# 如果端口被占用，修改 docker-compose.yml 中的端口
```

### 问题 2：无法访问应用

**症状**：浏览器显示"无法访问此网站"

**解决方法**：
```bash
# 检查容器状态
docker ps | grep pdf-extractor

# 在 NAS 上测试
curl http://localhost:5000

# 检查防火墙
sudo ufw status

# 如果防火墙阻止，开放端口
sudo ufw allow 5000/tcp
```

### 问题 3：PDF 解析失败

**症状**：上传 PDF 后显示"解析失败"

**解决方法**：
```bash
# 查看日志
docker-compose logs | grep -i error

# 检查目录权限
ls -la /tmp/pdfs
ls -la /tmp/extracted

# 修复权限
sudo chmod 755 /tmp/pdfs /tmp/extracted

# 重启容器
docker-compose restart
```

### 问题 4：内存不足

**症状**：容器被系统杀死

**解决方法**：
```bash
# 查看内存使用
free -h

# 编辑 docker-compose.yml，增加内存限制
# deploy:
#   resources:
#     limits:
#       memory: 4G

# 重启容器
docker-compose down
docker-compose up -d
```

---

## 部署检查清单

部署完成后，请确认：

- [ ] `docker ps` 显示容器运行中
- [ ] `docker-compose logs` 无错误信息
- [ ] `curl http://localhost:5000` 返回 200 OK
- [ ] 浏览器可以访问 http://192.168.1.100:5000
- [ ] 可以上传 PDF 文件
- [ ] 字段提取正常
- [ ] 可以下载 Excel 文件
- [ ] `/tmp/extracted/all_data.xlsx` 文件存在

---

## 预期时间

- 打包项目：1 分钟
- 上传到 NAS：2-5 分钟（取决于网络速度）
- 构建镜像：10-20 分钟（取决于 NAS 性能）
- 启动容器：1 分钟
- 验证测试：5 分钟

**总耗时**：约 20-30 分钟

---

## 成功标志

当看到以下内容时，部署成功：

1. ✅ `docker ps` 显示容器状态为 `Up X minutes (healthy)`
2. ✅ 浏览器可以访问应用页面
3. ✅ 可以成功上传和解析 PDF
4. ✅ 可以下载 Excel 文件

**恭喜！你的应用已成功部署到 NAS！** 🎉
