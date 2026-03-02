# 🚨 快速修复：找不到 Dockerfile 错误

根据你的错误信息，问题是 Docker 找不到 Dockerfile 文件。

---

## ⚡ 3 分钟快速修复

### 步骤 1：检查 Dockerfile 是否存在（30 秒）

1. 打开 NAS 文件管理器
2. 进入 `/volume1/docker/pdf-extractor/` 目录
3. 查看是否有 `Dockerfile` 文件

**❌ 如果没有** → 重新上传所有文件
**✅ 如果有** → 检查文件大小（应该 > 0 字节）

---

### 步骤 2：替换为简化配置（1 分钟）

1. 在 NAS 文件管理器中打开 `/volume1/docker/pdf-extractor/`
2. 找到 `docker-compose.yml` 文件
3. 删除或重命名它（改为 `docker-compose.yml.backup`）
4. 从部署包中找到 `docker-compose-simple.yml` 文件
5. 将它复制到 `/volume1/docker/pdf-extractor/` 目录
6. 重命名为 `docker-compose.yml`

**简化版配置内容**：
```yaml
services:
  pdf-extractor:
    build: .
    container_name: pdf-extractor
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - /volume1/docker/pdf-extractor/data:/tmp/extracted
      - /volume1/docker/pdf-extractor/temp:/tmp/pdfs
      - /volume1/docker/pdf-extractor:/app
    environment:
      - NODE_ENV=production
      - PORT=5000
```

---

### 步骤 3：删除并重新创建项目（1.5 分钟）

1. **删除现有项目**
   - 打开 Docker 管理界面
   - 点击 "Compose" 菜单
   - 找到 `pdf-extractor` 项目
   - 点击 "删除" 或垃圾桶图标
   - 确认删除

2. **重新创建项目**
   - 点击 "创建" 按钮
   - 填写：
     - 项目名称：`pdf-extractor`
     - 路径：`/volume1/docker/pdf-extractor`
     - 文件：`docker-compose.yml`
   - 点击 "保存"

3. **构建项目**
   - 点击项目右侧的 "..." 或 "操作"
   - 选择 "构建" 或 "Build"
   - 等待完成

---

## 🔍 如果问题依然存在

### 检查清单

请确认以下内容：

```
☐ Dockerfile 文件存在
☐ Dockerfile 大小 > 0 字节
☐ Dockerfile 文件名正确（Dockerfile，不是 dockerfile）
☐ docker-compose.yml 存在
☐ package.json 存在
☐ src/ 目录存在
☐ projects/ 目录存在
☐ data/ 目录已创建（空目录）
☐ temp/ 目录已创建（空目录）
```

### 最常见的原因

**原因 1：Dockerfile 没有上传**
- 重新从电脑上传 Dockerfile 到 NAS

**原因 2：文件名不对**
- 确保文件名是 `Dockerfile`（大写 D）
- 不是 `dockerfile`、`Dockerfile.txt` 等

**原因 3：文件损坏**
- 重新解压部署包
- 重新上传所有文件

---

## 💡 终极方案：手动创建容器

如果以上方法都不行，说明你的 Docker 管理工具的 Compose 功能有问题。

### 步骤：

1. **下载基础镜像**
   - 在 Docker 管理界面点击 "镜像" 菜单
   - 搜索：`node:20-alpine`
   - 下载镜像

2. **手动创建容器**
   - 点击 "容器" 菜单
   - 点击 "创建"
   - 填写以下配置：

   **基本信息**
   - 容器名称：`pdf-extractor`
   - 镜像：`node:20-alpine`

   **卷映射**
   - `/volume1/docker/pdf-extractor` → `/app` (读写)
   - `/volume1/docker/pdf-extractor/data` → `/tmp/extracted` (读写)
   - `/volume1/docker/pdf-extractor/temp` → `/tmp/pdfs` (读写)

   **端口**
   - 本地端口：`5000`
   - 容器端口：`5000`

   **环境变量**
   - `NODE_ENV` = `production`
   - `PORT` = `5000`

   **命令**
   - 命令：`/bin/sh`
   - 参数：`-c "cd /app && npm install -g pnpm && pnpm install && pnpm run build && pnpm run start"`

3. **启动容器**
   - 点击 "启动"
   - 等待依赖安装和构建（约 10-15 分钟）

4. **测试访问**
   - 浏览器访问：`http://your-nas-ip:5000`

---

## 📞 还是不行？

告诉我：
1. 你的 NAS 文件管理器中 `/volume1/docker/pdf-extractor/` 有哪些文件？
2. Dockerfile 文件存在吗？大小是多少？
3. 使用的是什么 NAS 系统？
4. 是否尝试过手动创建容器？

我会帮你找到解决方案！
