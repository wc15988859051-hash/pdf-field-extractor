# NAS Docker 部署 - 操作步骤总结

## 🎯 部署前准备

### 1. 确认 NAS 支持 Docker
- Synology: Container Manager (DSM 7.x) 或 Docker (DSM 6.x)
- QNAP: Container Station
- 其他: 确保支持 Docker

### 2. 确认 NAS 架构
```bash
# SSH 连接到 NAS 后执行
uname -m
```
- `x86_64` → 使用 `Dockerfile`
- `aarch64` 或 `arm64` → 使用 `Dockerfile.nas`

### 3. 准备项目文件
从项目导出以下文件：
- `Dockerfile` 或 `Dockerfile.nas`
- `docker-compose.yml`
- `package.json`
- `pnpm-lock.yaml`
- `next.config.ts`
- `src/` 目录（完整）
- `projects/` 目录（完整）
- `public/` 目录（完整）

---

## 📋 三种部署方法

### 方法一：Docker Compose（推荐）⭐

#### 适用于所有 NAS 图形化界面

**Synology (群晖) 步骤：**

1. 打开 **套件中心** → 找到 **Container Manager**
2. 点击左侧 **项目** → 点击 **创建**
3. 填写项目信息：
   - 项目名称: `pdf-field-extractor`
   - 路径: 选择包含文件的文件夹
   - 来源: `docker-compose.yml`
4. 点击 **完成**
5. 等待构建完成（10-20 分钟）
6. 访问 `http://NAS_IP:5000`

**QNAP (威联通) 步骤：**

1. 打开 **Container Station**
2. 点击 **创建** → **应用程序**
3. 填写名称: `pdf-field-extractor`
4. 在 YAML 区域粘贴 `docker-compose.yml` 内容
5. 点击 **创建**
6. 等待构建完成
7. 访问 `http://NAS_IP:5000`

---

### 方法二：手动构建镜像

**适用于需要自定义配置的场景**

**Synology 步骤：**

1. 打开 **Container Manager** → **映像**
2. 点击 **构建**
3. 填写：
   - 映像名称: `pdf-field-extractor`
   - 标签: `latest`
   - Dockerfile 路径: 选择项目文件夹
4. 点击 **构建** → 等待完成
5. 构建完成后，在 **映像** 列表中找到 `pdf-field-extractor:latest`
6. 点击 **启动**
7. 配置：
   - 容器名称: `pdf-field-extractor`
   - 端口映射: `本地 5000` → `容器 5000`
   - 重启策略: `除非停止`
8. 点击 **应用**

**QNAP 步骤：**

1. 打开 **Container Station** → **创建** → **映像**
2. 选择 **自建映像**
3. 填写名称: `pdf-field-extractor`
4. 选择 Dockerfile 路径
5. 点击 **构建**
6. 构建完成后，点击 **启动**
7. 配置端口和启动参数
8. 点击 **创建**

---

### 方法三：SSH 命令部署（高级）

**适用于熟悉命令行的用户**

1. **上传文件到 NAS**
   - 使用 File Station 或 SCP 上传到 `/docker/pdf-field-extractor`

2. **SSH 连接到 NAS**
   ```bash
   ssh username@nas_ip
   ```

3. **进入项目目录**
   ```bash
   cd /volume1/docker/pdf-field-extractor
   ```

4. **运行部署脚本**
   ```bash
   chmod +x nas-deploy.sh
   ./nas-deploy.sh
   ```

5. **访问应用**
   ```
   http://NAS_IP:5000
   ```

---

## 🔧 首次部署后验证

### 1. 检查容器状态
```bash
docker ps
```
应该看到 `pdf-field-extractor` 容器状态为 `Up`

### 2. 查看日志
```bash
docker logs pdf-field-extractor
```
确认无错误信息

### 3. 访问应用
打开浏览器访问: `http://NAS_IP:5000`

### 4. 测试功能
- 上传一个 PDF 文件
- 检查字段提取是否正常
- 下载 Excel 文件验证数据

---

## 🐛 常见问题解决

### 问题 1: 构建失败 - 网络错误

**解决方案:**
- 使用 `Dockerfile.nas`（包含国内镜像源）
- 或在 docker-compose.yml 中指定:
  ```yaml
  build:
    dockerfile: Dockerfile.nas
  ```

### 问题 2: 端口 5000 已被占用

**解决方案:**
修改 `docker-compose.yml`:
```yaml
services:
  pdf-field-extractor:
    ports:
      - "8080:5000"
```
访问地址变为: `http://NAS_IP:8080`

### 问题 3: 容器启动后立即退出

**解决方案:**
```bash
# 查看日志
docker logs pdf-field-extractor

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 问题 4: 无法访问应用

**检查清单:**
- [ ] 容器是否运行: `docker ps`
- [ ] 端口映射是否正确: `docker port pdf-field-extractor`
- [ ] 防火墙是否允许端口
- [ ] 使用正确的 IP 地址

---

## 🔄 更新应用

### 方法一：使用 Docker Compose
1. 上传新版本文件
2. 在图形界面点击 **重新构建**
3. 或 SSH 执行:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

### 方法二：命令行
```bash
# 停止并删除旧容器
docker stop pdf-field-extractor
docker rm pdf-field-extractor

# 删除旧镜像（可选）
docker rmi pdf-field-extractor:latest

# 重新构建
docker-compose build
docker-compose up -d
```

---

## 📊 配置优化

### 限制资源使用
在 Docker 图形界面中配置：
- **CPU 限制**: 1-2 核心
- **内存限制**: 1-2 GB
- **存储限制**: 10 GB

### 数据持久化
在 `docker-compose.yml` 中添加:
```yaml
volumes:
  - ./data:/tmp
  - ./logs:/app/logs
```

---

## 📚 详细文档

- **完整部署指南**: [NAS_DOCKER_DEPLOYMENT.md](./NAS_DOCKER_DEPLOYMENT.md)
- **快速参考**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Docker 文件说明**: [DOCKER_README.md](./DOCKER_README.md)

---

## ✅ 部署检查清单

部署前确认：
- [ ] NAS 支持 Docker
- [ ] 确认 CPU 架构
- [ ] 至少 2GB 可用内存
- [ ] 至少 5GB 可用磁盘空间
- [ ] 网络连接正常

部署后验证：
- [ ] 容器状态为 "运行中"
- [ ] 日志无错误信息
- [ ] 可以访问应用
- [ ] 上传 PDF 功能正常
- [ ] 字段提取正常
- [ ] Excel 下载正常

---

## 🎉 完成！

部署成功后，你就可以在 NAS 上使用 PDF 字段提取应用了！

**访问地址**: `http://NAS_IP:5000`

**常见操作**:
- 查看日志: `docker logs pdf-field-extractor`
- 重启容器: `docker restart pdf-field-extractor`
- 停止容器: `docker stop pdf-field-extractor`
- 启动容器: `docker start pdf-field-extractor`

---

**文档版本**: v1.0
**更新日期**: 2025-03-02
