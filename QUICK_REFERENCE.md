# NAS 部署快速参考

## 📋 前置检查清单

- [ ] NAS 支持 Docker
- [ ] NAS CPU 架构确认 (x86_64 / ARM64)
- [ ] 至少 2GB 可用内存
- [ ] 至少 5GB 可用磁盘空间
- [ ] 网络连接正常

## 🚀 三种部署方法

### 方法一：Docker Compose（推荐）⭐

#### Synology (群晖)：
1. 套件中心 → Container Manager
2. 项目 → 创建
3. 选择 docker-compose.yml
4. 点击完成

#### QNAP (威联通)：
1. Container Station
2. 创建 → 应用程序
3. 粘贴 docker-compose.yml
4. 点击创建

### 方法二：手动构建

1. 映像 → 构建
2. 选择 Dockerfile
3. 等待构建完成
4. 启动 → 配置端口和环境变量

### 方法三：SSH 命令

```bash
# 上传文件后执行
chmod +x nas-deploy.sh
./nas-deploy.sh
```

## 📁 必需文件清单

```
项目根目录/
├── Dockerfile (或 Dockerfile.nas)
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── src/
├── projects/
├── public/
└── nas-deploy.sh
```

## ⚙️ 配置参数

### 端口映射
- 默认: `5000:5000`
- 自定义: `8080:5000` (修改 docker-compose.yml)

### 环境变量
```yaml
NODE_ENV=production
PORT=5000
```

### 卷映射（可选）
```yaml
./data:/tmp          # 持久化处理后的文件
./logs:/app/logs     # 持久化日志
```

## 📊 资源需求

| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核心 | 2 核心 |
| 内存 | 1 GB | 2 GB |
| 存储 | 5 GB | 10 GB |

## 🔧 常用命令

### 容器管理
```bash
# 查看运行状态
docker ps -a

# 查看日志
docker logs pdf-field-extractor

# 实时日志
docker logs -f pdf-field-extractor

# 重启容器
docker restart pdf-field-extractor

# 停止容器
docker stop pdf-field-extractor

# 启动容器
docker start pdf-field-extractor
```

### 镜像管理
```bash
# 查看镜像
docker images pdf-field-extractor

# 删除旧镜像
docker rmi pdf-field-extractor:old

# 清理无用镜像
docker image prune -a
```

### 资源监控
```bash
# 查看资源使用
docker stats pdf-field-extractor

# 查看容器详情
docker inspect pdf-field-extractor
```

## 🐛 故障排查

### 问题 1: 容器无法启动

```bash
# 检查日志
docker logs pdf-field-extractor

# 常见原因:
# - 端口占用: 修改端口映射
# - 内存不足: 增加内存或优化配置
# - 构建失败: 重新构建镜像
```

### 问题 2: 构建失败

```bash
# 清理缓存
docker system prune -a

# 重新构建
docker build -t pdf-field-extractor:latest .
```

### 问题 3: 无法访问

```bash
# 检查容器状态
docker ps

# 检查端口映射
docker port pdf-field-extractor

# 检查防火墙
# 确保端口未被阻止
```

## 🔄 更新流程

### 方法一：使用 Docker Compose
```bash
# 1. 上传新文件
# 2. 在图形界面点击"重新构建"
```

### 方法二：命令行
```bash
# 停止并删除
docker stop pdf-field-extractor
docker rm pdf-field-extractor

# 重新构建
docker-compose build
docker-compose up -d
```

## 🔐 安全建议

1. **修改默认端口**: 使用非标准端口
2. **限制访问**: 配置防火墙规则
3. **使用 HTTPS**: 配置 SSL 证书
4. **定期更新**: 及时更新应用版本
5. **备份**: 定期备份数据目录

## 📱 NAS 品牌支持

| 品牌 | Docker 应用 | 支持状态 |
|------|-----------|---------|
| Synology | Container Manager | ✅ |
| QNAP | Container Station | ✅ |
| Asustor | Docker Manager | ✅ |
| Buffalo | Docker | ✅ |
| WD | Docker | ✅ |
| TerraMaster | Docker | ✅ |

## 🌐 访问地址

```
本地网络: http://NAS_IP:5000
域名访问: http://your-domain.com (配置反向代理)
```

## 📞 获取帮助

1. 查看容器日志
2. 查看 NAS 系统日志
3. 检查网络连接
4. 确认架构兼容性

## 📝 注意事项

1. **ARM 架构 NAS**: 使用 `Dockerfile.nas`
2. **首次构建**: 需要较长时间 (10-20 分钟)
3. **网络问题**: 配置镜像源加速
4. **数据持久化**: 映射数据目录

## 🎯 快速开始

```bash
# 1. 上传所有文件到 NAS
# 2. SSH 连接到 NAS
ssh username@nas_ip

# 3. 进入项目目录
cd /volume1/docker/pdf-field-extractor

# 4. 运行部署脚本
chmod +x nas-deploy.sh
./nas-deploy.sh

# 5. 访问应用
http://NAS_IP:5000
```

---

**文档版本**: v1.0
**更新日期**: 2025-03-02
