# Docker 部署快速参考卡片

## 🚀 一键部署（复制粘贴）

```bash
# 1. 在当前环境打包项目
cd /workspace/projects
tar -czf pdf-extractor.tar.gz \
  src/ public/ projects/ .coze \
  package.json pnpm-lock.yaml tsconfig.json next.config.mjs \
  tailwind.config.ts postcss.config.mjs components.json \
  requirements.txt Dockerfile docker-compose.yml

# 2. 上传到 NAS（替换 user 和 IP）
scp pdf-extractor.tar.gz user@192.168.1.100:/tmp/

# 3. 在 NAS 上部署
ssh user@192.168.1.100
sudo mkdir -p /opt/pdf-extractor /tmp/pdfs /tmp/extracted
cd /opt
sudo tar -xzf /tmp/pdf-extractor.tar.gz
sudo mv pdf-extractor-package pdf-extractor
cd pdf-extractor
docker-compose up -d

# 4. 查看状态
docker-compose logs -f
```

---

## 📋 常用命令速查

### 服务管理
```bash
cd /opt/pdf-extractor

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps
```

### 日志查看
```bash
# 实时日志
docker-compose logs -f

# 最近 100 行
docker-compose logs --tail=100

# 查找错误
docker-compose logs | grep -i error
```

### 容器管理
```bash
# 查看运行中的容器
docker ps

# 查看容器资源使用
docker stats pdf-extractor

# 进入容器
docker exec -it pdf-extractor /bin/bash

# 查看容器日志
docker logs -f pdf-extractor
```

### 系统检查
```bash
# 检查 Docker 状态
sudo systemctl status docker

# 检查端口占用
sudo lsof -i:5000

# 检查磁盘空间
df -h

# 检查内存
free -h

# 检查 CPU
top
```

---

## 🌐 访问地址

| 类型 | 地址 |
|------|------|
| 本地访问 | http://localhost:5000 |
| 局域网访问 | http://192.168.1.100:5000 |
| 外网访问（端口转发） | http://your-public-ip:8000 |
| 外网访问（DDNS） | http://your-domain.com:8000 |

---

## 🔧 修改配置

### 修改端口
编辑 `docker-compose.yml`：
```yaml
ports:
  - "8080:5000"  # 将 8080 改为你想要的端口
```

### 修改内存限制
编辑 `docker-compose.yml`：
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # 将 2G 改为你想要的内存大小
```

### 修改 CPU 限制
编辑 `docker-compose.yml`：
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'  # 将 2.0 改为你想要的 CPU 核心数
```

---

## 📊 性能监控

```bash
# 实时监控容器资源
docker stats pdf-extractor

# 查看容器详细信息
docker inspect pdf-extractor

# 查看容器进程
docker exec pdf-extractor ps aux

# 查看容器文件系统
docker exec pdf-extractor ls -la /app
```

---

## 🧹 清理维护

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a

# 清理临时文件
sudo rm -rf /tmp/pdfs/*
sudo rm -rf /tmp/extracted/*
```

---

## 🔄 更新应用

```bash
cd /opt/pdf-extractor

# 1. 停止服务
docker-compose down

# 2. 备份当前版本
sudo cp -r /opt/pdf-extractor /opt/pdf-extractor.backup.$(date +%Y%m%d)

# 3. 上传新文件
# （使用 scp 或其他方式）

# 4. 重新构建
docker-compose build --no-cache

# 5. 启动服务
docker-compose up -d

# 6. 查看日志
docker-compose logs -f
```

---

## 📁 文件位置

| 路径 | 说明 |
|------|------|
| /opt/pdf-extractor | 项目目录 |
| /tmp/pdfs | PDF 临时文件 |
| /tmp/extracted | Excel 输出文件 |
| /tmp/extracted/all_data.xlsx | 全局 Excel 文件 |

---

## 🔍 故障排查快速诊断

### 问题：容器无法启动
```bash
# 查看日志
docker-compose logs

# 检查端口
sudo lsof -i:5000

# 检查内存
free -h
```

### 问题：无法访问应用
```bash
# 检查容器状态
docker ps | grep pdf-extractor

# 测试本地访问
curl http://localhost:5000

# 检查防火墙
sudo ufw status
```

### 问题：PDF 解析失败
```bash
# 查看错误日志
docker-compose logs | grep -i error

# 检查目录权限
ls -la /tmp/pdfs
ls -la /tmp/extracted

# 修复权限
sudo chmod 755 /tmp/pdfs /tmp/extracted
```

### 问题：内存不足
```bash
# 查看内存使用
free -h

# 查看 OOM 日志
sudo dmesg | grep -i oom

# 解决方案：增加内存限制
```

---

## 📞 获取帮助

1. 查看详细文档：`cat /opt/pdf-extractor/DOCKER_DEPLOYMENT.md`
2. 查看容器日志：`docker-compose logs -f`
3. 检查系统资源：`free -h`、`df -h`
4. 查看容器状态：`docker ps`

---

## 🎯 快速检查清单

部署后检查：
- [ ] `docker ps` 显示容器运行中
- [ ] `docker-compose logs` 无错误信息
- [ ] `curl http://localhost:5000` 返回 200 OK
- [ ] 浏览器可以访问 http://your-nas-ip:5000
- [ ] 可以上传 PDF 文件
- [ ] 可以提取字段
- [ ] 可以下载 Excel

---

**保存此卡片以备不时之需！** 📌
