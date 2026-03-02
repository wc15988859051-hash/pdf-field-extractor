# 图形界面 Docker 部署指南（无 SSH）

如果你的 NAS 不支持 SSH 或你更习惯使用图形界面，可以按照以下步骤操作：

---

## 📋 准备工作

### 1. 下载部署包
从 `nas-deploy-package/` 目录下载以下文件到你的电脑：
- `pdf-extractor-nas.tar.gz` (主程序包)
- `QUICK-START.md` (快速开始指南)

### 2. 解压部署包
在你的电脑上解压 `pdf-extractor-nas.tar.gz` 文件，得到以下文件和目录：
- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- `src/` 目录
- `projects/` 目录
- 等其他项目文件

---

## 🖥️ 通过图形界面部署

### 方法 1：使用 Docker 图形界面创建容器（不推荐）

#### 步骤 1: 上传文件到 NAS
1. 打开 NAS 的文件管理器
2. 创建新目录：`/volume1/docker/pdf-extractor/`
3. 创建数据目录：`/volume1/docker/pdf-extractor/data/`
4. 创建临时目录：`/volume1/docker/pdf-extractor/temp/`
5. 将所有解压后的文件上传到 `/volume1/docker/pdf-extractor/`

#### 步骤 2: 在 Docker 管理界面创建容器
1. 打开 Docker 管理界面（你截图中的界面）
2. 点击"创建"按钮
3. 选择"自定义容器"
4. 填写以下配置：

**基本信息**
- 容器名称：`pdf-extractor`
- 镜像：选择 `node:20-alpine`

**卷设置**
- 添加卷映射：
  - `/volume1/docker/pdf-extractor` → `/app` (读写)
  - `/volume1/docker/pdf-extractor/data` → `/tmp/extracted` (读写)
  - `/volume1/docker/pdf-extractor/temp` → `/tmp/pdfs` (读写)

**端口设置**
- 本地端口：`5000`
- 容器端口：`5000`
- 协议：`TCP`

**环境变量**
- `NODE_ENV` = `production`
- `PORT` = `5000`

**命令**
- 命令：`/bin/sh`
- 参数：`-c "cd /app && npm install -g pnpm && pnpm install && pnpm run build && pnpm run start"`

#### 步骤 3: 启动容器
1. 点击"应用"或"创建"按钮
2. 等待容器启动（首次启动需要安装依赖和构建，约 5-10 分钟）
3. 查看容器状态，确保状态为"运行中"

#### 步骤 4: 测试访问
在浏览器中访问：`http://your-nas-ip:5000`

---

### 方法 2：使用 Docker Compose（推荐）

#### 步骤 1: 上传文件到 NAS
1. 打开 NAS 的文件管理器
2. 创建新目录：`/volume1/docker/pdf-extractor/`
3. 创建数据目录：`/volume1/docker/pdf-extractor/data/`
4. 创建临时目录：`/volume1/docker/pdf-extractor/temp/`
5. 将所有解压后的文件上传到 `/volume1/docker/pdf-extractor/`

#### 步骤 2: 在 Docker 管理界面创建 Compose 项目
1. 打开 Docker 管理界面
2. 点击左侧菜单中的"Compose"
3. 点击"创建"按钮
4. 填写以下信息：

**基本信息**
- 项目名称：`pdf-extractor`
- 路径：`/volume1/docker/pdf-extractor`
- Docker Compose 文件：选择 `docker-compose.yml`

#### 步骤 3: 构建并启动
1. 点击"构建"按钮，等待镜像构建完成（约 5-10 分钟）
2. 构建完成后，点击"启动"按钮
3. 查看容器状态，确保状态为"运行中"

#### 步骤 4: 查看日志
1. 点击"日志"菜单
2. 选择 `pdf-extractor` 容器
3. 查看实时日志，确认服务正常启动

#### 步骤 5: 测试访问
在浏览器中访问：`http://your-nas-ip:5000`

---

## ⚠️ 图形界面部署的局限性

1. **构建时间长**：首次构建需要 5-10 分钟
2. **配置复杂**：需要手动配置多个参数
3. **调试困难**：无法方便地查看详细的构建日志
4. **维护不便**：更新和升级需要手动操作

---

## 🔧 常见问题

### 1. 容器启动失败
**检查步骤**：
1. 查看 Docker 日志
2. 检查端口 5000 是否被占用
3. 检查目录权限是否正确

**解决方案**：
- 停止并删除容器，重新创建
- 检查环境变量配置是否正确

### 2. 无法访问应用
**检查步骤**：
1. 确认容器正在运行
2. 检查端口映射是否正确
3. 检查防火墙设置

**解决方案**：
- 确认端口 5000 已开放
- 检查 NAS 网络设置

### 3. 应用功能异常
**检查步骤**：
1. 查看容器日志
2. 检查数据目录权限
3. 检查 Python 依赖是否安装

**解决方案**：
- 重新构建镜像
- 检查日志中的错误信息

---

## 💡 建议

虽然可以通过图形界面部署，但我们**强烈建议使用 SSH 命令行方式**，原因如下：

1. ✅ **操作更简单**：只需几条命令即可完成部署
2. ✅ **出错概率低**：自动配置，减少手动操作错误
3. ✅ **易于调试**：可以方便地查看详细日志
4. ✅ **方便维护**：更新和升级更便捷
5. ✅ **文档完善**：有详细的部署指南和故障排查步骤

---

## 📞 需要帮助？

如果通过图形界面部署遇到困难，请尝试：
1. 查看 Docker 日志
2. 检查容器配置
3. 参考详细部署指南 `NAS-DEPLOYMENT-GUIDE.md`

或者考虑使用 SSH 命令行方式部署，步骤详见 `QUICK-START.md`。
