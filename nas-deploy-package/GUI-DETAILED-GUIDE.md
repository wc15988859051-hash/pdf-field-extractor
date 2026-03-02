# 📖 图形界面 Docker 部署详细指南

根据你的 Docker 管理界面，我为你准备了详细的图形界面部署步骤。

---

## 🎯 推荐方案：使用 Docker Compose（最简单）

### 准备工作

#### 1. 下载部署包
从沙箱下载 `/workspace/projects/pdf-extractor-complete-deploy-package.tar.gz` 到你的电脑

#### 2. 解压文件
在你的电脑上解压 `pdf-extractor-complete-deploy-package.tar.gz`，得到：
- `pdf-extractor-nas.tar.gz`（主程序包）
- `README.md`
- `QUICK-START.md`
- `NAS-DEPLOYMENT-GUIDE.md`
- `GUI-DEPLOYMENT-GUIDE.md`

#### 3. 再次解压主程序包
在你的电脑上解压 `pdf-extractor-nas.tar.gz`，你会看到很多文件：
- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- `src/` 文件夹
- `projects/` 文件夹
- 等等...

---

## 📤 步骤 1：上传文件到 NAS

### 方法 A：通过 NAS 文件管理器上传

1. **打开 NAS 文件管理器**
   - 登录 NAS 的网页界面
   - 进入文件管理器

2. **创建目录结构**
   ```
   /volume1/docker/
   └── pdf-extractor/
       ├── data/          (数据目录)
       ├── temp/          (临时文件目录)
       ├── Dockerfile
       ├── docker-compose.yml
       ├── package.json
       ├── src/
       └── projects/
   ```

3. **上传文件**
   - 选择所有解压后的文件和文件夹
   - 上传到 `/volume1/docker/pdf-extractor/` 目录
   - 确保所有文件都已上传成功

### 方法 B：通过 FTP/SFTP 上传

1. **使用 FTP 客户端**（如 FileZilla、WinSCP）
2. **连接到 NAS**
3. **上传所有文件到** `/volume1/docker/pdf-extractor/`

---

## 🐳 步骤 2：在 Docker 管理界面创建 Compose 项目

根据你的截图界面操作：

### 2.1 打开 Compose 菜单

1. 在 Docker 管理界面中
2. 点击左侧菜单的 **"Compose"**（带有 Docker Compose 图标）

### 2.2 创建新项目

1. 点击右上角的 **"创建"** 或 **"+"** 按钮
2. 填写项目信息：

**基本信息**
- **项目名称**：`pdf-extractor`
- **路径**：`/volume1/docker/pdf-extractor`
- **Docker Compose 文件**：`docker-compose.yml`

### 2.3 配置项目（如果需要）

如果系统显示 docker-compose.yml 的内容，确保以下配置正确：

```yaml
version: '3.8'

services:
  pdf-extractor:
    build: .
    container_name: pdf-extractor
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - pdf-data:/tmp/extracted
      - pdf-temp:/tmp/pdfs
    environment:
      - NODE_ENV=production
      - PORT=5000
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  pdf-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /volume1/docker/pdf-extractor/data

  pdf-temp:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /volume1/docker/pdf-extractor/temp

networks:
  default:
    name: pdf-extractor-network
```

### 2.4 保存配置

1. 点击 **"保存"** 或 **"创建"** 按钮
2. 项目创建成功后，会显示在 Compose 项目列表中

---

## 🔨 步骤 3：构建镜像

### 3.1 选择项目

在 Compose 项目列表中，找到刚创建的 `pdf-extractor` 项目

### 3.2 开始构建

1. 点击项目右侧的 **"操作"** 或 **"..."** 按钮
2. 选择 **"构建"** 或 **"Build"** 选项
3. 系统开始构建 Docker 镜像

### 3.3 等待构建完成

**⏱️ 预计时间：5-10 分钟**

构建过程会：
1. 下载 `node:20-alpine` 基础镜像
2. 安装 Node.js 依赖
3. 编译 Next.js 应用
4. 安装 Python 依赖
5. 生成最终镜像

**💡 提示**：
- 首次构建较慢，请耐心等待
- 构建进度可能在日志中显示
- 不要关闭浏览器窗口

---

## ▶️ 步骤 4：启动容器

### 4.1 启动服务

1. 构建完成后，点击项目右侧的 **"操作"** 或 **"..."** 按钮
2. 选择 **"启动"** 或 **"Start"** 选项
3. 等待容器启动

### 4.2 检查状态

1. 在 **"容器"** 菜单中查看
2. 找到 `pdf-extractor` 容器
3. 确认状态为 **"运行中"** 或 **"Running"**

---

## 📊 步骤 5：查看日志

### 5.1 打开日志

1. 在 **"容器"** 菜单中
2. 点击 `pdf-extractor` 容器
3. 选择 **"日志"** 或 **"Logs"** 标签

### 5.2 查看启动日志

正常的启动日志应该类似：

```
✓ Ready in 5.2s
```

如果看到错误信息，记录下来以便排查。

---

## 🌐 步骤 6：测试访问

### 6.1 局域网访问

在浏览器中访问：
```
http://your-nas-ip:5000
```

将 `your-nas-ip` 替换为你的 NAS IP 地址（例如：`http://192.168.1.100:5000`）

### 6.2 功能测试

1. **页面加载**：应该能看到 PDF 字段提取应用的界面
2. **上传 PDF**：点击上传区域，选择一个 PDF 文件
3. **字段提取**：查看是否能正常提取字段
4. **下载 Excel**：测试 Excel 下载功能

---

## 🔧 步骤 7：配置域名访问（可选）

如果你想通过域名访问应用，需要配置反向代理。

### 7.1 准备域名

- 确保你有一个域名（如 `pdf.yourdomain.com`）
- 在域名注册商处添加 A 记录，指向你的 NAS 公网 IP

### 7.2 配置端口转发（如果 NAS 在内网）

在路由器中配置：
- 外部端口 80 → 内部 NAS IP:80
- 外部端口 443 → 内部 NAS IP:443

### 7.3 配置反向代理

根据你的 NAS 系统，可能使用 Nginx 或其他 Web 服务器。

**Nginx 配置示例**：
```nginx
server {
    listen 80;
    server_name pdf.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 50M;
    }
}
```

### 7.4 配置 SSL（Let's Encrypt）

使用 certbot 获取免费 SSL 证书：

```bash
# 在 NAS 终端运行（如果有）
certbot certonly --standalone -d pdf.yourdomain.com
```

然后更新 Nginx 配置以使用 HTTPS。

---

## 📱 步骤 8：日常管理

### 查看容器状态

1. 进入 Docker 管理界面
2. 点击 **"容器"** 菜单
3. 找到 `pdf-extractor` 容器
4. 查看状态、CPU、内存使用情况

### 重启服务

1. 点击容器右侧的 **"操作"** 按钮
2. 选择 **"重启"** 或 **"Restart"**

### 停止服务

1. 点击容器右侧的 **"操作"** 按钮
2. 选择 **"停止"** 或 **"Stop"**

### 查看日志

1. 点击容器
2. 选择 **"日志"** 标签
3. 可以选择日志级别和时间范围

### 更新应用

1. 上传新版本文件到 `/volume1/docker/pdf-extractor/`
2. 在 Compose 界面点击 **"重新构建"** 或 **"Rebuild"**
3. 构建完成后，点击 **"重启"**

---

## ⚠️ 常见问题

### 问题 1：构建失败

**症状**：构建过程中出现错误

**解决方法**：
1. 查看构建日志，找到错误信息
2. 确保所有文件都已正确上传
3. 检查 NAS 是否有足够的存储空间
4. 确保网络连接正常（需要下载镜像）

### 问题 2：容器无法启动

**症状**：容器显示"已停止"或"错误"状态

**解决方法**：
1. 查看容器日志，找到错误原因
2. 检查端口 5000 是否被占用
3. 检查目录权限是否正确
4. 尝试删除容器，重新创建

### 问题 3：无法访问应用

**症状**：浏览器无法打开 `http://your-nas-ip:5000`

**解决方法**：
1. 确认容器正在运行
2. 检查防火墙设置，确保端口 5000 已开放
3. 检查端口映射是否正确（本地端口 5000 → 容器端口 5000）
4. 尝试在 NAS 内部访问：`http://localhost:5000`

### 问题 4：PDF 解析失败

**症状**：上传 PDF 后无法提取字段

**解决方法**：
1. 查看容器日志，寻找错误信息
2. 确认 Python 依赖已正确安装
3. 检查 `/volume1/docker/pdf-extractor/temp/` 目录权限
4. 尝试重启容器

### 问题 5：内存不足

**症状**：容器频繁重启或性能很差

**解决方法**：
1. 查看容器资源使用情况
2. 在 NAS 设置中增加 Docker 内存限制
3. 或者优化 Next.js 配置，减少内存使用

---

## 💡 小贴士

1. **首次构建慢**：第一次构建需要 5-10 分钟，请耐心等待
2. **查看日志**：遇到问题时，首先查看日志
3. **备份数据**：定期备份 `/volume1/docker/pdf-extractor/data/` 目录
4. **监控资源**：关注 CPU 和内存使用情况
5. **及时更新**：定期检查并更新应用

---

## 📞 需要帮助？

如果遇到问题：

1. **查看日志**：在 Docker 管理界面查看容器日志
2. **检查配置**：确认 docker-compose.yml 配置正确
3. **查看文档**：参考 `NAS-DEPLOYMENT-GUIDE.md` 中的故障排查章节
4. **提供信息**：如果需要帮助，提供：
   - NAS 型号和系统版本
   - 错误日志内容
   - 具体操作步骤

---

## 🎉 部署完成

如果一切顺利，你现在可以通过浏览器访问应用了！

**访问地址**：`http://your-nas-ip:5000`

开始使用 PDF 字段提取功能吧！🚀
