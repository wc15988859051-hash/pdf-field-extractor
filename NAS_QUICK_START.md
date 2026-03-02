# 🚀 NAS 部署快速指南

## 📦 准备工作清单

部署前请确认：
- [ ] NAS 已开机并连接到网络
- [ ] 可以通过 SSH 连接到 NAS
- [ ] NAS 有足够的存储空间（至少 10GB）
- [ ] NAS 架构为 x86_64（推荐）或 ARM64

---

## 🎯 三种部署方案

### 方案一：自动部署脚本（最简单）⭐ 推荐

**适用场景**：Ubuntu/Debian 系统，希望快速部署

#### 步骤：

1. **下载部署脚本**
   ```bash
   # 从当前环境复制脚本到 NAS
   scp /workspace/projects/nas-deploy.sh user@your-nas-ip:/tmp/

   # 在 NAS 上执行
   chmod +x /tmp/nas-deploy.sh
   sudo /tmp/nas-deploy.sh
   ```

2. **上传项目文件**（脚本会提示）
   ```bash
   # 在本地电脑上执行
   cd /workspace/projects
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
     requirements.txt

   # 上传到 NAS
   scp pdf-extractor.tar.gz user@your-nas-ip:/opt/pdf-extractor/

   # 在 NAS 上解压
   ssh user@your-nas-ip
   cd /opt/pdf-extractor
   tar -xzf pdf-extractor.tar.gz
   rm pdf-extractor.tar.gz
   ```

3. **重新运行脚本**
   ```bash
   sudo /tmp/nas-deploy.sh
   ```

**完成！** 访问 `http://your-nas-ip:5000`

---

### 方案二：Docker 部署（推荐生产环境）

**适用场景**：已安装 Docker，希望环境隔离

#### 步骤：

1. **上传项目文件到 NAS**
   ```bash
   scp -r /workspace/projects/* user@your-nas-ip:/opt/pdf-extractor/
   ```

2. **在 NAS 上构建和运行**
   ```bash
   ssh user@your-nas-ip
   cd /opt/pdf-extractor

   # 使用 Docker Compose
   docker-compose up -d

   # 或使用 Docker 命令
   docker build -t pdf-extractor:latest .
   docker run -d \
     --name pdf-extractor \
     -p 5000:5000 \
     -v /tmp/pdfs:/tmp/pdfs \
     -v /tmp/extracted:/tmp/extracted \
     --restart unless-stopped \
     pdf-extractor:latest
   ```

3. **查看运行状态**
   ```bash
   docker ps | grep pdf-extractor
   docker logs -f pdf-extractor
   ```

---

### 方案三：手动部署（完全控制）

**适用场景**：需要自定义配置

参考 `NAS_DEPLOYMENT_GUIDE.md` 中的详细步骤

---

## 📝 部署后验证

部署完成后，请执行以下验证：

1. **检查服务状态**
   ```bash
   sudo systemctl status pdf-extractor  # 直接部署
   docker ps | grep pdf-extractor       # Docker 部署
   ```

2. **测试访问**
   ```bash
   curl http://localhost:5000
   # 应返回 HTML 内容
   ```

3. **测试功能**
   - 打开浏览器访问 `http://your-nas-ip:5000`
   - 上传一个 PDF 文件
   - 检查字段提取是否正常
   - 下载 Excel 文件验证数据

---

## 🔧 常用命令

### 直接部署（systemd）

```bash
# 查看服务状态
sudo systemctl status pdf-extractor

# 启动服务
sudo systemctl start pdf-extractor

# 停止服务
sudo systemctl stop pdf-extractor

# 重启服务
sudo systemctl restart pdf-extractor

# 查看实时日志
sudo journalctl -u pdf-extractor -f

# 查看最近 50 行日志
sudo journalctl -u pdf-extractor -n 50
```

### Docker 部署

```bash
# 查看容器状态
docker ps | grep pdf-extractor

# 查看日志
docker logs -f pdf-extractor

# 重启容器
docker restart pdf-extractor

# 停止容器
docker stop pdf-extractor

# 启动容器
docker start pdf-extractor

# 进入容器
docker exec -it pdf-extractor /bin/bash

# Docker Compose
docker-compose up -d      # 启动
docker-compose down       # 停止
docker-compose restart    # 重启
docker-compose logs -f    # 查看日志
```

---

## 🌐 访问方式

### 局域网访问
```
http://192.168.1.100:5000  （替换为你的 NAS IP）
```

### 外网访问

#### 方法 1：路由器端口转发
1. 登录路由器管理后台
2. 找到"端口转发"设置
3. 添加规则：
   - 外部端口：8000
   - 内部 IP：NAS IP（如 192.168.1.100）
   - 内部端口：5000
4. 访问：`http://your-public-ip:8000`

#### 方法 2：使用 DDNS
1. 注册 DDNS 服务（如 DuckDNS）
2. 配置 NAS 或路由器
3. 访问：`http://your-ddns-domain.com:8000`

#### 方法 3：内网穿透（frp）
参考 frp 官方文档配置

---

## 📊 监控与维护

### 查看资源使用
```bash
# CPU 和内存
htop

# 磁盘空间
df -h

# 查看进程
ps aux | grep node
```

### 清理临时文件
```bash
# 清理 PDF 临时文件
rm -rf /tmp/pdfs/*

# 清理 Excel 临时文件
rm -rf /tmp/extracted/*
```

### 更新应用
```bash
# 停止服务
sudo systemctl stop pdf-extractor

# 备份
cp -r /opt/pdf-extractor /opt/pdf-extractor.backup

# 上传新文件
# （使用 scp 或 git）

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

## ❓ 常见问题

### Q: 端口 5000 被占用
**A:** 修改 `.coze` 文件中的端口配置

### Q: Python 依赖安装失败
**A:**
```bash
# 使用国内镜像
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple PyMuPDF==1.23.26 openpyxl==3.1.5
```

### Q: 内存不足
**A:** 修改 `.coze` 文件或 Docker 配置，增加内存限制

### Q: 无法访问
**A:**
1. 检查防火墙设置
2. 确认服务正在运行
3. 检查 NAS IP 地址

---

## 📞 获取帮助

如遇到问题：
1. 查看 `NAS_DEPLOYMENT_GUIDE.md` 详细文档
2. 查看服务日志
3. 检查系统要求是否满足
4. 提供以下信息寻求帮助：
   - NAS 型号和系统版本
   - Node.js 和 Python 版本
   - 错误日志
   - 操作步骤

---

## 🎉 部署成功后

部署成功后，你将拥有：
- ✅ 完全私有的 PDF 字段提取系统
- ✅ 数据完全存储在你的 NAS 上
- ✅ 可通过局域网快速访问
- ✅ 支持开机自启
- ✅ 完整的日志记录

**开始使用：**
```
打开浏览器访问 http://your-nas-ip:5000
```

---

## 📚 相关文档

- [详细部署指南](./NAS_DEPLOYMENT_GUIDE.md)
- [通用部署说明](./DEPLOYMENT.md)
- [项目说明](./README.md)

---

**祝部署顺利！如有问题随时询问。** 🚀
