# PDF 字段提取应用 - NAS 部署指南

## 📋 前置条件

### 1. NAS 准备
- [ ] NAS 已安装 Docker（从你的截图看已安装）
- [ ] NAS 有 SSH 访问权限（需在 NAS 设置中开启）
- [ ] 有足够的存储空间（至少 2GB 可用空间）
- [ ] NAS 已连接到互联网（用于下载 Docker 镜像和依赖）

### 2. 域名准备（可选但推荐）
- [ ] 已有域名（或使用 DDNS）
- [ ] 已配置 DNS 解析到 NAS 的公网 IP
- [ ] 路由器已配置端口转发（如 NAS 在内网）

---

## 🚀 部署步骤

### 第一步：在沙箱中打包项目

1. **打包项目文件**
   ```bash
   cd /workspace/projects
   tar -czf pdf-extractor-nas-deploy.tar.gz \
     --exclude=node_modules \
     --exclude=.next \
     --exclude=.git \
     --exclude=logs \
     --exclude=public/*.png \
     --exclude=public/*.jpg \
     --exclude=public/*.jpeg \
     .
   ```

2. **下载打包文件**
   - 打包文件位置：`/workspace/projects/pdf-extractor-nas-deploy.tar.gz`
   - 将此文件下载到你的电脑

3. **上传到 NAS**
   - 通过 NAS 的文件管理器或 SFTP 工具将文件上传到 NAS 的 `/volume1/docker/` 目录
   - 或上传到其他你选择的目录

---

### 第二步：SSH 连接到 NAS

1. **启用 SSH**
   - 进入 NAS 控制面板
   - 找到"终端机和 SNMP"或"SSH 服务"设置
   - 启用 SSH 服务（端口 22）

2. **SSH 连接**
   ```bash
   # Windows 使用 PowerShell 或 Git Bash
   ssh your-nas-username@your-nas-ip

   # Mac/Linux 使用 Terminal
   ssh your-nas-username@your-nas-ip
   ```

3. **切换到 root 用户（如需要）**
   ```bash
   sudo -i
   ```

---

### 第三步：在 NAS 上部署

1. **创建工作目录**
   ```bash
   mkdir -p /volume1/docker/pdf-extractor
   mkdir -p /volume1/docker/pdf-extractor/data
   mkdir -p /volume1/docker/pdf-extractor/temp
   cd /volume1/docker/pdf-extractor
   ```

2. **解压项目文件**
   ```bash
   # 如果文件在其他位置，先移动到当前目录
   mv /path/to/pdf-extractor-nas-deploy.tar.gz .
   tar -xzf pdf-extractor-nas-deploy.tar.gz
   rm pdf-extractor-nas-deploy.tar.gz
   ```

3. **检查文件是否完整**
   ```bash
   ls -la
   # 应该看到以下文件：
   # - Dockerfile
   # - docker-compose.yml
   # - package.json
   # - src/
   # - projects/
   ```

4. **构建 Docker 镜像**
   ```bash
   # 第一次构建会较慢（约 5-10 分钟）
   docker-compose build
   ```

5. **启动服务**
   ```bash
   docker-compose up -d
   ```

6. **检查服务状态**
   ```bash
   # 查看容器状态
   docker-compose ps

   # 查看日志
   docker-compose logs -f

   # 如果看到错误，按 Ctrl+C 退出日志查看
   ```

7. **测试访问**
   ```bash
   # 在 NAS 内部测试
   curl -I http://localhost:5000

   # 应该返回 HTTP 200 OK
   ```

---

### 第四步：配置域名访问（可选）

#### 方法 1：使用 Nginx 反向代理

1. **创建 Nginx 配置文件**
   ```bash
   vi /etc/nginx/conf.d/pdf-extractor.conf
   ```

2. **添加以下内容**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # 替换为你的域名

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

           client_max_body_size 50M;
           proxy_connect_timeout 300s;
           proxy_send_timeout 300s;
           proxy_read_timeout 300s;
       }
   }
   ```

3. **重启 Nginx**
   ```bash
   nginx -t
   nginx -s reload
   ```

4. **配置 SSL（Let's Encrypt）**
   ```bash
   # 安装 certbot（如果未安装）
   # 根据你的 NAS 系统选择相应命令

   # 获取证书
   certbot certonly --standalone -d your-domain.com

   # 更新 Nginx 配置以使用 HTTPS
   vi /etc/nginx/conf.d/pdf-extractor.conf
   ```

5. **更新 Nginx 配置为 HTTPS**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

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

           client_max_body_size 50M;
           proxy_connect_timeout 300s;
           proxy_send_timeout 300s;
           proxy_read_timeout 300s;
       }
   }
   ```

6. **重启 Nginx**
   ```bash
   nginx -s reload
   ```

#### 方法 2：使用 Caddy（更简单）

1. **安装 Caddy**
   ```bash
   # 根据你的 NAS 系统选择安装方式
   ```

2. **创建 Caddyfile**
   ```bash
   vi /etc/caddy/Caddyfile
   ```

3. **添加以下内容**
   ```
   your-domain.com {
       reverse_proxy localhost:5000
   }
   ```

4. **启动 Caddy**
   ```bash
   caddy run --config /etc/caddy/Caddyfile
   ```

---

### 第五步：测试和验证

1. **本地测试**
   ```bash
   curl -I http://localhost:5000
   ```

2. **局域网测试**
   - 在浏览器中访问：`http://your-nas-ip:5000`

3. **域名测试（如果已配置）**
   - 在浏览器中访问：`http://your-domain.com` 或 `https://your-domain.com`

4. **功能测试**
   - 上传一个 PDF 文件
   - 检查是否能正常提取字段
   - 下载 Excel 文件并验证数据

---

## 📊 常用命令

### Docker 命令
```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器和卷
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 进入容器内部
docker exec -it pdf-extractor sh
```

### 数据管理
```bash
# 查看生成的 Excel 文件
ls -lh /volume1/docker/pdf-extractor/data/

# 备份数据
tar -czf pdf-extractor-backup-$(date +%Y%m%d).tar.gz \
  /volume1/docker/pdf-extractor/data/

# 清理旧数据（慎用）
rm -rf /volume1/docker/pdf-extractor/data/*
```

---

## 🔧 故障排查

### 1. 容器无法启动
```bash
# 查看详细日志
docker-compose logs pdf-extractor

# 检查端口是否被占用
netstat -tuln | grep 5000
```

### 2. 访问超时
```bash
# 检查容器是否在运行
docker-compose ps

# 检查防火墙设置
# 确保端口 5000 已开放

# 测试容器内部服务
docker exec -it pdf-extractor wget -O- http://localhost:5000
```

### 3. PDF 解析失败
```bash
# 查看应用日志
docker-compose logs -f pdf-extractor

# 检查 Python 依赖
docker exec -it pdf-extractor pip3 list | grep -E 'PyMuPDF|openpyxl'
```

### 4. 内存不足
```bash
# 查看资源使用情况
docker stats pdf-extractor

# 限制容器内存（编辑 docker-compose.yml）
services:
  pdf-extractor:
    deploy:
      resources:
        limits:
          memory: 1G
```

---

## 📈 监控和维护

### 1. 设置自动备份
```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点备份数据
0 2 * * * tar -czf /volume1/backup/pdf-extractor-$(date +\%Y\%m\%d).tar.gz /volume1/docker/pdf-extractor/data/
```

### 2. 定期更新
```bash
# 拉取最新代码（如果使用 Git）
git pull

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

### 3. 日志管理
```bash
# 限制日志大小（编辑 docker-compose.yml）
services:
  pdf-extractor:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 📞 技术支持

如果遇到问题，请提供以下信息：
1. NAS 型号和系统版本
2. Docker 版本
3. 错误日志（`docker-compose logs` 输出）
4. 具体错误信息

---

## 📝 更新日志

- v1.0.0 (2024-03-02)
  - 初始版本
  - 支持 PDF 字段提取
  - 全局 Excel 合并功能
  - 历史记录功能
  - Docker 部署支持
