# 极空间（ZimaNAS）Docker 部署指南

本指南专门针对极空间 NAS 用户提供详细的部署步骤。

---

## 🎯 极空间部署方法

极空间支持两种部署方式：
1. **Docker Manager 图形界面**（推荐）
2. **SSH 命令部署**（高级用户）

---

## 方法一：使用 Docker Manager 图形界面（推荐）

### 第一步：安装 Docker Manager

1. 打开极空间桌面
2. 进入 **应用中心**
3. 搜索并安装 **Docker Manager**
   - 如果已安装，直接跳到第二步

### 第二步：准备项目文件

#### 方式 A：通过极空间网页上传

1. 在电脑上打开极空间网页版
2. 登录后进入 **文件管理**
3. 创建文件夹路径：`/docker/pdf-field-extractor`
4. 上传以下文件到该文件夹：

**必需文件：**
- `docker-compose.yml`
- `Dockerfile` 或 `Dockerfile.nas`
- `package.json`
- `pnpm-lock.yaml`
- `next.config.ts`
- `src/` 目录（完整上传）
- `projects/` 目录（完整上传）
- `public/` 目录（完整上传）

#### 方式 B：通过极空间客户端上传

1. 打开极空间桌面客户端
2. 进入 **我的文件**
3. 创建文件夹：`/docker/pdf-field-extractor`
4. 将项目文件拖拽上传

### 第三步：在 Docker Manager 中创建容器

1. 打开 **Docker Manager** 应用
2. 点击左侧 **容器** 菜单
3. 点击右上角 **+** 号或 **创建容器**
4. 选择 **从 Docker Compose 创建**

### 第四步：配置 Compose 项目

1. **项目名称**：输入 `pdf-field-extractor`
2. **项目路径**：
   - 点击浏览，选择 `/docker/pdf-field-extractor` 文件夹
   - 系统会自动识别 `docker-compose.yml` 文件
3. 点击 **下一步**

### 第五步：确认配置

系统会显示配置预览，检查以下信息：

```
服务名称: pdf-field-extractor
镜像: pdf-field-extractor:latest
端口映射: 5000:5000
重启策略: unless-stopped
```

确认无误后，点击 **创建** 或 **完成**

### 第六步：等待构建

1. 系统会自动开始构建 Docker 镜像
2. 首次构建可能需要 **10-20 分钟**
3. 可以在 Docker Manager 中查看构建进度
4. 构建完成后，容器会自动启动

### 第七步：验证部署

1. 在 Docker Manager 中，进入 **容器** 页面
2. 找到 `pdf-field-extractor` 容器
3. 检查状态是否为 **运行中**
4. 点击容器名称，查看日志，确认无错误
5. 打开浏览器访问：`http://极空间IP:5000`

**极空间 IP 查找方法：**
- 打开极空间桌面
- 右上角设置 → 系统信息
- 查看 IP 地址

---

## 方法二：SSH 命令部署（高级）

### 第一步：开启 SSH

1. 打开极空间桌面
2. 进入 **设置**
3. 找到 **远程访问** 或 **SSH**
4. 开启 SSH 服务
5. 设置 SSH 端口（默认 22）

### 第二步：SSH 连接到极空间

**在电脑上打开终端/命令提示符：**

```bash
ssh admin@极空间IP
# 例如: ssh admin@192.168.1.100
```

输入极空间的登录密码

### 第三步：确认 Docker 已安装

```bash
docker --version
docker-compose --version
```

如果显示版本信息，说明 Docker 已安装成功

### 第四步：上传项目文件

**使用 SCP 上传（在电脑终端执行）：**

```bash
# Windows 使用 PowerShell
scp -r .\pdf-field-extractor\* admin@极空间IP:/docker/pdf-field-extractor/

# Mac/Linux
scp -r ./pdf-field-extractor/* admin@极空间IP:/docker/pdf-field-extractor/
```

或使用 FileZilla 等 SFTP 工具上传

### 第五步：创建项目目录并部署

```bash
# 创建项目目录
mkdir -p /docker/pdf-field-extractor
cd /docker/pdf-field-extractor

# 确认文件已上传
ls -la

# 运行部署脚本
chmod +x nas-deploy.sh
./nas-deploy.sh
```

### 第六步：验证部署

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs pdf-field-extractor

# 如果容器未运行，手动启动
docker start pdf-field-extractor
```

访问应用：`http://极空间IP:5000`

---

## 🔧 极空间特定配置

### 检查极空间架构

极空间有不同的型号，需要确认 CPU 架构：

1. SSH 连接到极空间
2. 执行命令：
   ```bash
   uname -m
   ```

**结果说明：**
- `x86_64` → 使用 `Dockerfile`
- `aarch64` 或 `arm64` → 使用 `Dockerfile.nas`

**常见极空间型号架构：**
- ZimaBoard → x86_64
- ZimaNAS 部分型号 → ARM64

### 修改 docker-compose.yml 使用正确的 Dockerfile

如果是 ARM64 架构，修改 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  pdf-field-extractor:
    build:
      context: .
      dockerfile: Dockerfile.nas  # 改为 Dockerfile.nas
    container_name: pdf-field-extractor
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./data:/tmp
      - ./logs:/app/logs
    restart: unless-stopped
```

---

## 🎨 极空间 Docker Manager 详细操作

### 创建容器（手动方式）

如果不想使用 Docker Compose，可以手动创建：

1. 打开 Docker Manager
2. 点击 **镜像** → **获取镜像**
3. 点击 **本地构建**
4. 填写信息：
   - 镜像名称: `pdf-field-extractor`
   - 标签: `latest`
   - Dockerfile 路径: `/docker/pdf-field-extractor`
5. 点击 **构建**，等待完成

### 创建并运行容器

1. 在 **镜像** 列表中找到 `pdf-field-extractor:latest`
2. 点击 **运行**
3. 配置参数：

**基本设置：**
- 容器名称: `pdf-field-extractor`

**端口映射：**
- 主机端口: `5000`
- 容器端口: `5000`

**卷挂载（可选）：**
- `/docker/pdf-field-extractor/data` → `/tmp`
- `/docker/pdf-field-extractor/logs` → `/app/logs`

**环境变量：**
- `NODE_ENV=production`
- `PORT=5000`

**重启策略：**
- 选择 **除非停止**

4. 点击 **完成** 或 **创建**

---

## 🐛 极空间常见问题

### 问题 1: Docker Manager 无法找到

**解决方案：**
1. 检查极空间系统版本
2. 在应用中心搜索 "Docker"
3. 如果没有，更新极空间固件

### 问题 2: 构建失败 - 网络超时

**解决方案：**
1. 使用 `Dockerfile.nas`（包含国内镜像源）
2. 在 docker-compose.yml 中指定使用 `Dockerfile.nas`
3. 检查极空间网络连接

### 问题 3: 端口 5000 被占用

**解决方案：**
修改 `docker-compose.yml`:
```yaml
ports:
  - "8080:5000"  # 改为其他端口
```
访问地址变为: `http://极空间IP:8080`

### 问题 4: 容器启动后立即退出

**解决方案：**
```bash
# SSH 连接后执行
docker logs pdf-field-extractor

# 查看具体错误信息，根据错误修复

# 重新构建
cd /docker/pdf-field-extractor
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 问题 5: 无法访问应用

**检查清单：**
- [ ] 容器状态是否为"运行中"
- [ ] 防火墙是否允许 5000 端口
- [ ] 极空间 IP 是否正确
- [ ] 是否在同一局域网

---

## 📊 极空间性能优化

### 限制资源使用

在 Docker Manager 中创建容器时：

1. 点击 **高级设置**
2. **资源限制**：
   - CPU 限制: 1-2 核心
   - 内存限制: 1-2 GB

### 数据持久化

在 docker-compose.yml 中配置：

```yaml
volumes:
  - /docker/pdf-field-extractor/data:/tmp
  - /docker/pdf-field-extractor/logs:/app/logs
```

这样即使删除容器，数据也会保留。

---

## 🔄 更新应用

### 方法一：使用 Docker Manager

1. 停止容器：在 Docker Manager 中点击停止
2. 删除容器
3. 删除旧镜像
4. 上传新版本文件
5. 重新构建镜像
6. 创建新容器

### 方法二：SSH 命令

```bash
cd /docker/pdf-field-extractor

# 停止并删除旧容器
docker stop pdf-field-extractor
docker rm pdf-field-extractor

# 删除旧镜像
docker rmi pdf-field-extractor:latest

# 重新构建
docker-compose build
docker-compose up -d
```

---

## 📱 极空间型号支持

✅ **完全支持的型号：**
- ZimaBoard
- ZimaNAS
- 极空间 Z2
- 极空间 Z4
- 极空间 Z4S
- 极空间 Z4 Pro

**注意事项：**
- ARM64 型号需要使用 `Dockerfile.nas`
- 首次构建时间较长（10-20 分钟）
- 确保有足够的存储空间

---

## 🎯 部署检查清单

### 部署前
- [ ] 已安装 Docker Manager
- [ ] 确认极空间架构（x86_64/ARM64）
- [ ] 至少 2GB 可用内存
- [ ] 至少 5GB 可用磁盘空间
- [ ] 网络连接正常

### 部署后
- [ ] 容器状态为"运行中"
- [ ] 日志无错误信息
- [ ] 可以访问应用
- [ ] 上传 PDF 功能正常
- [ ] 字段提取正常
- [ ] Excel 下载正常

---

## 🌐 访问应用

### 局域网访问
```
http://极空间IP:5000
```

### 局域网 IP 查找
1. 打开极空间桌面
2. 设置 → 系统信息
3. 查看网络信息中的 IP 地址

### 外网访问（可选）
如果需要在外网访问：

1. **极空间自带外网访问**：
   - 在极空间桌面开启外网访问
   - 使用极空间提供的域名访问

2. **配置反向代理**：
   - 需要额外的 Nginx 容器
   - 配置 SSL 证书
   - 设置域名解析

---

## 📞 获取帮助

### 查看日志
```bash
docker logs pdf-field-extractor
```

### 查看容器状态
```bash
docker ps -a
```

### 重启容器
```bash
docker restart pdf-field-extractor
```

### 进入容器调试
```bash
docker exec -it pdf-field-extractor /bin/bash
```

---

## 🎉 完成！

部署成功后，你就可以在极空间上使用 PDF 字段提取应用了！

**访问地址**: `http://极空间IP:5000`

**推荐操作流程：**
1. 在浏览器打开应用
2. 上传一个测试 PDF 文件
3. 检查字段提取结果
4. 下载 Excel 文件验证数据
5. 添加到极空间桌面快捷方式（方便访问）

---

## 📚 相关文档

- **通用部署指南**: [NAS_DOCKER_DEPLOYMENT.md](./NAS_DOCKER_DEPLOYMENT.md)
- **快速参考**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **部署步骤总结**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**文档版本**: v1.0
**更新日期**: 2025-03-02
**适用设备**: 极空间全系列 NAS
