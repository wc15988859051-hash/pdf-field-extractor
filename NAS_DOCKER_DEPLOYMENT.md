# NAS Docker 部署指南

本指南将帮助你在 NAS 上使用图形化 Docker 界面部署 PDF 字段提取应用。

## 前置准备

### 1. 确认 NAS 支持 Docker
- **Synology (群晖)**: Docker 套件 (DSM 6.x) 或 Container Manager (DSM 7.x)
- **QNAP (威联通)**: Container Station
- **Asustor (华芸)**: Docker Manager
- **其他 NAS**: 确保支持 Docker 容器运行

### 2. 准备项目文件
在部署前，需要将以下文件打包或准备到 NAS 上：
- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- `pnpm-lock.yaml`
- `next.config.ts`
- `src/` 目录
- `projects/` 目录
- `public/` 目录

---

## 方法一：使用 Docker Compose（推荐）

适用于大多数 NAS 系统，配置简单，易于管理。

### 步骤 1: 在 NAS 上创建项目文件夹

1. 打开 NAS 的文件管理器（如 Synology File Station）
2. 在 `docker` 目录下创建项目文件夹，例如：`/docker/pdf-field-extractor`
3. 将所有项目文件上传到该文件夹

### 步骤 2: 在 Docker 图形界面中创建项目

#### Synology (群晖) 操作步骤：

1. 打开 **套件中心** 或 **所有应用程序**
2. 找到并打开 **Container Manager** (DSM 7.x) 或 **Docker** (DSM 6.x)
3. 点击左侧菜单 **项目** (Project)
4. 点击 **创建** 按钮
5. 填写项目信息：
   - **项目名称**: `pdf-field-extractor`
   - **路径**: 选择你创建的项目文件夹 `/docker/pdf-field-extractor`
   - **来源类型**: 选择 `docker-compose.yml`
6. 点击 **下一步**
7. 系统会自动识别 `docker-compose.yml` 文件
8. 检查配置信息：
   - 容器名称: `pdf-field-extractor`
   - 端口映射: `5000:5000`
   - 重启策略: `unless-stopped`
9. 点击 **完成** 开始构建和启动

#### QNAP (威联通) 操作步骤：

1. 打开 **Container Station**
2. 点击 **创建** → **应用程序**
3. 填写应用程序名称: `pdf-field-extractor`
4. 在 **模板 (YAML)** 区域粘贴 `docker-compose.yml` 内容
5. 点击 **创建**
6. 等待容器构建和启动

### 步骤 3: 验证部署

1. 在 Docker 管理界面中，找到 `pdf-field-extractor` 容器
2. 检查容器状态是否为 **运行中**
3. 点击 **日志** 查看启动日志，确认无错误
4. 打开浏览器访问：`http://NAS_IP:5000`

---

## 方法二：使用 Dockerfile 手动构建

适用于需要自定义配置的场景。

### 步骤 1: 在 NAS 上创建项目文件夹

1. 在 NAS 上创建文件夹：`/docker/pdf-field-extractor`
2. 上传所有项目文件到该文件夹

### 步骤 2: 使用 Docker 图形界面构建镜像

#### Synology (群晖) 操作步骤：

1. 打开 **Container Manager** 或 **Docker**
2. 点击左侧菜单 **映像** (Image)
3. 点击 **构建** 按钮
4. 填写构建信息：
   - **映像名称**: `pdf-field-extractor`
   - **标签**: `latest`
   - **Dockerfile 路径**: 选择项目文件夹，会自动识别 Dockerfile
5. 点击 **选择文件** 确保项目路径正确
6. 点击 **构建** 开始构建镜像
7. 等待构建完成（可能需要 10-20 分钟）

### 步骤 3: 创建并启动容器

1. 构建完成后，在 **映像** 列表中找到 `pdf-field-extractor:latest`
2. 点击 **启动** 或 **运行**
3. 配置容器设置：
   - **容器名称**: `pdf-field-extractor`
   - **端口映射**: `本地端口 5000` → `容器端口 5000`
   - **卷映射** (可选):
     - `docker/pdf-field-extractor/data` → `/tmp` (持久化数据)
     - `docker/pdf-field-extractor/logs` → `/app/logs` (日志)
   - **环境变量**:
     - `NODE_ENV=production`
     - `PORT=5000`
   - **重启策略**: `除非停止` (unless-stopped)
4. 点击 **应用** 或 **下一步** 完成创建
5. 容器会自动启动

### 步骤 4: 验证部署

1. 在 **容器** 列表中检查 `pdf-field-extractor` 状态
2. 点击 **日志** 查看运行状态
3. 访问 `http://NAS_IP:5000` 测试应用

---

## 方法三：使用 SSH 命令部署（高级）

如果你熟悉命令行，可以通过 SSH 连接到 NAS 并执行命令。

### 步骤 1: SSH 连接到 NAS

```bash
ssh username@nas_ip
```

### 步骤 2: 创建项目目录并上传文件

```bash
mkdir -p /volume1/docker/pdf-field-extractor
cd /volume1/docker/pdf-field-extractor
# 使用 scp 或其他工具上传文件到该目录
```

### 步骤 3: 构建并启动

```bash
# 使用 docker-compose（推荐）
docker-compose up -d

# 或使用 docker 命令
docker build -t pdf-field-extractor:latest .
docker run -d \
  --name pdf-field-extractor \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -v /volume1/docker/pdf-field-extractor/data:/tmp \
  --restart unless-stopped \
  pdf-field-extractor:latest
```

---

## 常见问题排查

### 1. 容器无法启动

**检查日志**：
- 在 Docker 图形界面中查看容器日志
- 常见错误：
  - 端口 5000 已被占用：修改端口映射
  - 内存不足：增加 NAS 内存或优化配置
  - Python 依赖安装失败：检查网络连接

**解决方案**：
```bash
# SSH 连接后查看日志
docker logs pdf-field-extractor

# 重启容器
docker restart pdf-field-extractor
```

### 2. 构建失败（构建镜像时错误）

**常见原因**：
- 网络问题导致依赖下载失败
- NAS 架构不支持（如 ARM 架构的 NAS）
- 磁盘空间不足

**解决方案**：
1. 确保网络连接正常
2. 检查 NAS CPU 架构：
   ```bash
   uname -m
   ```
   - 如果是 `arm64` 或 `aarch64`，需要修改 Dockerfile
3. 清理 Docker 缓存：
   ```bash
   docker system prune -a
   ```

### 3. 访问应用时无法连接

**检查项**：
1. 容器是否运行：`docker ps`
2. 端口映射是否正确：检查 `docker-compose.yml` 或容器设置
3. NAS 防火墙是否允许 5000 端口
4. 使用正确的 IP 地址访问

### 4. Python 脚本执行失败

**检查日志**：
```bash
docker logs pdf-field-extractor | grep -i error
```

**常见问题**：
- Python 版本不匹配：确保使用 Python 3.12
- 依赖未安装：检查 Dockerfile 中的 pip install 命令

---

## 更新应用

### 方法一：使用 Docker Compose

1. 上传新版本的文件到 NAS 项目文件夹
2. 打开 Docker 图形界面
3. 在 **项目** 页面选择 `pdf-field-extractor`
4. 点击 **重新构建** 或 **停止后启动**

### 方法二：手动更新

```bash
# SSH 连接到 NAS
cd /volume1/docker/pdf-field-extractor

# 停止并删除旧容器
docker stop pdf-field-extractor
docker rm pdf-field-extractor

# 删除旧镜像（可选）
docker rmi pdf-field-extractor:latest

# 重新构建镜像
docker build -t pdf-field-extractor:latest .

# 启动新容器
docker run -d \
  --name pdf-field-extractor \
  -p 5000:5000 \
  --restart unless-stopped \
  pdf-field-extractor:latest
```

---

## 性能优化建议

1. **资源限制**：在容器设置中限制 CPU 和内存使用
2. **持久化存储**：映射 `/tmp` 和 `/app/logs` 到 NAS 存储卷
3. **日志管理**：定期清理日志文件
4. **备份**：定期备份 `data` 目录中的重要数据

---

## 端口配置

如果 NAS 的 5000 端口已被占用，可以修改端口映射：

### docker-compose.yml 修改：
```yaml
services:
  pdf-field-extractor:
    ports:
      - "8080:5000"  # 将本地端口改为 8080
```

### 容器设置修改：
- 本地端口：`8080` (或其他未占用的端口)
- 容器端口：`5000` (保持不变)

访问地址变为：`http://NAS_IP:8080`

---

## 反向代理配置（可选）

如果希望通过域名访问，可以配置反向代理：

### Synology (群晖)：
1. 打开 **控制面板** → **应用程序门户**
2. 选择 **反向代理**
3. 创建新的反向代理：
   - **来源**: `pdf.yourdomain.com`
   - **目的地**: `http://localhost:5000`

### QNAP (威联通)：
1. 打开 **应用中心** → **Virtual Web Server**
2. 配置反向代理规则

---

## 安全建议

1. **修改默认端口**：不要使用常见的 5000 端口
2. **配置防火墙**：只允许内网访问
3. **定期更新**：及时更新应用和依赖
4. **使用 HTTPS**：配置 SSL 证书
5. **访问控制**：配置 NAS 用户权限

---

## 支持的 NAS 品牌

- ✅ Synology (群晖)
- ✅ QNAP (威联通)
- ✅ Asustor (华芸)
- ✅ Buffalo (巴法络)
- ✅ WD (西部数据)
- ✅ TerraMaster (铁威马)
- ✅ 其他支持 Docker 的 NAS

---

## 获取帮助

如果遇到问题：

1. 查看 Docker 容器日志
2. 检查 NAS 系统日志
3. 确认网络连接正常
4. 验证 NAS 架构兼容性
5. 联系 NAS 官方支持

---

## 快速参考

### 常用命令

```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs pdf-field-extractor

# 重启容器
docker restart pdf-field-extractor

# 停止容器
docker stop pdf-field-extractor

# 删除容器
docker rm pdf-field-extractor

# 清理无用镜像
docker image prune -a

# 查看资源使用
docker stats pdf-field-extractor
```

### 目录结构

```
/docker/pdf-field-extractor/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── src/
├── projects/
├── public/
└── data/          # 持久化数据（运行时创建）
```

---

## 更新日志

- **v1.0** (2025-03-02): 初始 Docker 部署支持
