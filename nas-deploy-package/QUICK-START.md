# 快速开始指南

## 🚀 3 步完成部署

### 1. 上传文件到 NAS
将 `pdf-extractor-nas.tar.gz` 上传到 NAS 的 `/volume1/docker/` 目录

### 2. SSH 连接到 NAS
```bash
ssh your-nas-username@your-nas-ip
```

### 3. 运行部署命令
```bash
# 创建工作目录
mkdir -p /volume1/docker/pdf-extractor
mkdir -p /volume1/docker/pdf-extractor/data
mkdir -p /volume1/docker/pdf-extractor/temp
cd /volume1/docker/pdf-extractor

# 解压项目
tar -xzf /volume1/docker/pdf-extractor-nas.tar.gz

# 构建并启动（第一次会较慢，约 5-10 分钟）
docker-compose build
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📝 测试访问

部署完成后，在浏览器中访问：
- 局域网: `http://your-nas-ip:5000`
- 域名: `http://your-domain.com`（如果已配置域名）

## 📚 详细文档

查看 `NAS-DEPLOYMENT-GUIDE.md` 获取完整的部署指南。

## ⚠️ 注意事项

1. 确保已安装 Docker
2. 确保有足够的存储空间（至少 2GB）
3. 第一次构建会较慢（约 5-10 分钟）
4. 如遇到问题，查看 `docker-compose logs` 输出
