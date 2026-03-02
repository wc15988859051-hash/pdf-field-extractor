# Docker 部署文件说明

本目录包含用于在 NAS 上部署 PDF 字段提取应用的所有 Docker 相关文件。

## 📦 文件清单

### 核心配置文件

1. **Dockerfile** - 标准 Docker 镜像构建文件
   - 基于 Node.js 24 和 Python 3.12
   - 多阶段构建，优化镜像大小
   - 适用于 x86_64 架构

2. **Dockerfile.nas** - NAS 优化版 Dockerfile
   - 使用国内镜像源加速
   - 优化 ARM64 架构支持
   - 减少构建时间

3. **docker-compose.yml** - Docker Compose 配置
   - 一键部署配置
   - 包含健康检查
   - 自动重启策略

4. **.dockerignore** - Docker 构建忽略文件
   - 优化构建速度
   - 减小镜像大小

### 部署工具

5. **nas-deploy.sh** - NAS 快速部署脚本
   - 自动化部署流程
   - 环境检查
   - 错误处理

### 文档文件

6. **NAS_DOCKER_DEPLOYMENT.md** - 详细部署指南
   - 三种部署方法
   - 详细的操作步骤
   - 故障排查指南
   - 支持所有主流 NAS 品牌

7. **QUICK_REFERENCE.md** - 快速参考卡片
   - 常用命令速查
   - 配置参数说明
   - 故障排查步骤
   - 快速开始指南

## 🚀 快速开始

### 推荐部署流程

#### 对于图形化界面用户（推荐）

1. **准备文件**
   - 将以下文件上传到 NAS 上的 `/docker/pdf-field-extractor` 目录：
     - `docker-compose.yml`
     - `Dockerfile` (或 `Dockerfile.nas`)
     - `package.json`
     - `pnpm-lock.yaml`
     - `next.config.ts`
     - `src/` 目录
     - `projects/` 目录
     - `public/` 目录

2. **使用 Docker Compose 部署**
   - 打开 NAS 的 Docker 管理界面
   - 创建新项目，选择 `docker-compose.yml`
   - 点击创建，等待构建完成

3. **访问应用**
   - 打开浏览器访问 `http://NAS_IP:5000`

#### 对于命令行用户

1. **上传文件到 NAS**

2. **SSH 连接到 NAS**
   ```bash
   ssh username@nas_ip
   ```

3. **运行部署脚本**
   ```bash
   cd /path/to/project
   chmod +x nas-deploy.sh
   ./nas-deploy.sh
   ```

## 📚 文档导航

### 初次部署
👉 阅读 **[NAS_DOCKER_DEPLOYMENT.md](./NAS_DOCKER_DEPLOYMENT.md)**

- 详细的步骤说明
- 图形化界面操作指南
- 三种部署方法对比

### 快速查询
👉 查看 **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**

- 常用命令速查
- 配置参数说明
- 故障排查步骤

### 高级配置
👉 编辑 **docker-compose.yml**

- 自定义端口映射
- 配置数据持久化
- 设置环境变量

### 针对不同 NAS 架构

**x86_64 架构**（Intel/AMD）
- 使用 `Dockerfile`

**ARM64 架构**（部分 NAS）
- 使用 `Dockerfile.nas`
- 或在 docker-compose.yml 中指定:
  ```yaml
  build:
    dockerfile: Dockerfile.nas
  ```

## 🔧 配置说明

### 端口配置

默认端口: `5000`

修改端口，编辑 `docker-compose.yml`:
```yaml
services:
  pdf-field-extractor:
    ports:
      - "8080:5000"  # 改为 8080
```

### 数据持久化

映射本地目录到容器:

```yaml
volumes:
  - ./data:/tmp          # 持久化处理后的文件
  - ./logs:/app/logs     # 持久化日志
```

### 环境变量

```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
```

## 🛠️ 故障排查

### 查看日志
```bash
docker logs pdf-field-extractor
```

### 重启容器
```bash
docker restart pdf-field-extractor
```

### 重新构建
```bash
docker-compose build
docker-compose up -d
```

详细排查步骤请参考 **[NAS_DOCKER_DEPLOYMENT.md](./NAS_DOCKER_DEPLOYMENT.md)** 的故障排查章节。

## 📊 资源需求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核心 | 2 核心 |
| 内存 | 1 GB | 2 GB |
| 存储 | 5 GB | 10 GB |

## 🔐 安全建议

1. 修改默认端口
2. 配置防火墙规则
3. 使用 HTTPS（配置反向代理）
4. 定期更新应用
5. 备份重要数据

## 📱 支持的 NAS 品牌

- ✅ Synology (群晖)
- ✅ QNAP (威联通)
- ✅ Asustor (华芸)
- ✅ Buffalo (巴法络)
- ✅ WD (西部数据)
- ✅ TerraMaster (铁威马)

## 🆘 获取帮助

如果遇到问题：

1. 查看容器日志: `docker logs pdf-field-extractor`
2. 查看详细文档: [NAS_DOCKER_DEPLOYMENT.md](./NAS_DOCKER_DEPLOYMENT.md)
3. 查看快速参考: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

## 📝 更新日志

- **v1.0** (2025-03-02)
  - 初始 Docker 部署支持
  - 支持 x86_64 和 ARM64 架构
  - 完整的部署文档

---

**注意**: 首次构建可能需要 10-20 分钟，请耐心等待。
