# Docker 部署指南（极空间）

## 📋 目录

- [部署方案概述](#部署方案概述)
- [准备工作](#准备工作)
- [方法一：极空间 Docker 部署（推荐）](#方法一极空间-docker-部署推荐)
- [方法二：命令行部署](#方法二命令行部署)
- [配置环境变量](#配置环境变量)
- [访问应用](#访问应用)
- [常见问题](#常见问题)

---

## 部署方案概述

### 方案优势

使用 Docker 部署到极空间的优势：

- ✅ **保留 Python 支持**：无需迁移代码到 Node.js
- ✅ **完全控制**：可以自由配置环境
- ✅ **数据持久化**：可以在 NAS 上保存生成的 Excel 文件
- ✅ **稳定性好**：不受第三方平台限制
- ✅ **本地运行**：数据不离开家庭网络

### 技术栈

- **基础镜像**: Node.js 20 + Alpine Linux
- **运行环境**: Python 3.12 + Node.js 20
- **Web 框架**: Next.js 16
- **容器编排**: Docker Compose

---

## 准备工作

### 1. 确认极空间配置

确保你的极空间满足以下条件：

- [ ] 已安装 Docker 容器应用
- [ ] 极空间系统版本支持 Docker（大多数新机型都支持）
- [ ] 有足够的存储空间（建议至少 2GB 可用空间）

### 2. 获取 Coze API 凭据

访问 Coze 平台获取必要的凭据：

- **国内版**: https://www.coze.cn/
- **国际版**: https://www.coze.com/

需要获取：
- `COZE_API_KEY` - API 密钥
- `COZE_BOT_ID` - Bot ID
- `COZE_BASE_URL` - API 基础 URL

### 3. 克隆或下载项目

#### 方案 A：从 GitHub 克隆（如果已推送到 GitHub）

```bash
git clone https://github.com/YOUR_USERNAME/pdf-field-extractor.git
cd pdf-field-extractor
```

#### 方案 B：直接下载代码包

1. 访问你的 GitHub 仓库
2. 点击 **"Code"** → **"Download ZIP"**
3. 解压到极空间的一个目录

---

## 方法一：极空间 Docker 部署（推荐）

### 步骤 1：在极空间中安装 Docker

1. 打开极空间管理后台
2. 进入 **"应用中心"** 或 **"容器"**
3. 找到 **Docker** 应用并安装
4. 启动 Docker 服务

### 步骤 2：准备项目文件

1. 将项目文件上传到极空间
2. 建议路径：`/Docker/pdf-field-extractor/`

上传的文件应包括：
```
pdf-field-extractor/
├── Dockerfile
├── docker-compose.yml
├── .env.docker
├── package.json
├── pnpm-lock.yaml
├── src/
├── projects/
└── requirements.txt
```

### 步骤 3：配置环境变量

在极空间中：

1. 打开 `.env.docker` 文件
2. 填写你的 Coze API 凭据：

```bash
# Coze API 密钥
COZE_API_KEY=pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Coze API 基础 URL
COZE_BASE_URL=https://api.coze.cn

# Coze Bot ID
COZE_BOT_ID=7380123456789012345
```

3. 保存文件

### 步骤 4：创建 Docker 容器

#### 使用极空间的图形界面：

1. 打开极空间的 Docker 应用
2. 点击 **"创建容器"** 或 **"新建"**
3. 选择 **"从文件创建"** 或 **"自定义"**

#### 配置容器参数：

**基本信息**：
- **名称**: `pdf-field-extractor`
- **镜像**: 不需要（使用 Dockerfile 构建）

**构建设置**：
- **构建上下文**: `/Docker/pdf-field-extractor/`
- **Dockerfile**: `Dockerfile`

**端口映射**：
- **容器端口**: `5000`
- **主机端口**: `5000`（或其他未占用的端口）

**环境变量**：
- `COZE_API_KEY`: `你的API密钥`
- `COZE_BASE_URL`: `https://api.coze.cn`
- `COZE_BOT_ID`: `你的BotID`
- `NODE_ENV`: `production`
- `PORT`: `5000`

**卷映射**（可选，用于数据持久化）：
- `/tmp` → `/Docker/pdf-field-extractor/temp`

**重启策略**：
- 选择 **"始终重启"** 或 **"除非手动停止"**

### 步骤 5：构建并启动容器

1. 点击 **"构建"** 或 **"Apply"**
2. 等待构建完成（可能需要 5-10 分钟）
3. 构建完成后，点击 **"启动"**

### 步骤 6：验证容器运行

1. 查看容器状态，应该显示 **"运行中"**
2. 查看容器日志，确认没有错误

---

## 方法二：命令行部署

如果你可以通过 SSH 访问极空间，可以使用命令行部署。

### 步骤 1：SSH 连接到极空间

```bash
ssh 你的用户名@极空间IP地址
```

### 步骤 2：导航到项目目录

```bash
cd /Docker/pdf-field-extractor
```

### 步骤 3：配置环境变量

```bash
cp .env.docker .env
```

然后编辑 `.env` 文件，填写你的 Coze API 凭据：

```bash
nano .env
```

填写完成后按 `Ctrl+X`，然后 `Y`，再按 `Enter` 保存。

### 步骤 4：构建并启动容器

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 步骤 5：验证运行状态

```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs -f pdf-field-extractor
```

---

## 配置环境变量

### 获取 Coze API 凭据

#### 步骤 1：登录 Coze 平台

访问：
- 国内版：https://www.coze.cn/
- 国际版：https://www.coze.com/

#### 步骤 2：创建 Bot

1. 点击 **"创建 Bot"**
2. 填写 Bot 信息：
   - 名称：`pdf-field-extractor`
   - 描述：PDF 字段提取助手
3. 点击 **"创建"**

#### 步骤 3：获取 BOT_ID

在 Bot 详情页，找到 Bot ID（纯数字）。

#### 步骤 4：获取 API_KEY

1. 在 Bot 详情页，点击 **"发布"** 标签
2. 找到 **"API"** 部分
3. 创建或获取 API Key（以 `pat_` 开头）

#### 步骤 5：确定 BASE_URL

- **国内版（coze.cn）**: `https://api.coze.cn`
- **国际版（coze.com）**: `https://api.coze.com`

### 环境变量示例

```bash
COZE_API_KEY=pat_8abc123def456ghi789jkl012mno345pq
COZE_BASE_URL=https://api.coze.cn
COZE_BOT_ID=7380123456789012345
```

---

## 访问应用

### 在本地网络访问

部署成功后，在浏览器中访问：

```
http://极空间IP地址:5000
```

例如：
```
http://192.168.1.100:5000
```

### 配置外网访问（可选）

如果需要从外网访问，可以：

#### 方法 1：使用极空间的 DDNS

1. 在极空间管理后台启用 DDNS
2. 配置端口转发（路由器）
3. 使用域名访问

#### 方法 2：使用反向代理

使用 Nginx 或 Traefik 进行反向代理。

---

## 常见问题

### Q1: 构建失败，提示内存不足

**A**: 极空间可能内存不足。解决方案：

1. 关闭其他不必要的容器
2. 或在极空间中增加 Docker 内存限制（如果支持）

### Q2: 容器启动后无法访问

**A**: 检查以下几点：

1. **端口映射是否正确**
   - 确认主机端口和容器端口都是 `5000`

2. **防火墙是否开放**
   - 检查极空间防火墙设置
   - 确保端口 5000 开放

3. **容器是否正常运行**
   ```bash
   docker-compose ps
   docker-compose logs pdf-field-extractor
   ```

### Q3: PDF 解析失败

**A**: 检查：

1. **Python 依赖是否正确安装**
   - 查看容器日志：`docker-compose logs -f`

2. **Coze API 凭据是否正确**
   - 确认 `.env` 文件中的凭据有效

3. **临时目录权限**
   - 确认 `/tmp` 目录有读写权限

### Q4: 如何更新应用？

**A**: 更新步骤：

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建容器
docker-compose build

# 3. 重启容器
docker-compose up -d
```

### Q5: 如何查看日志？

**A**:

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs -f pdf-field-extractor

# 查看最后 100 行日志
docker-compose logs --tail=100 pdf-field-extractor
```

### Q6: 如何停止和删除容器？

**A**:

```bash
# 停止容器
docker-compose stop

# 删除容器
docker-compose down

# 删除容器和卷
docker-compose down -v
```

### Q7: 如何备份数据？

**A**:

**备份 Excel 文件**（如果配置了卷映射）：

```bash
# 复制临时目录
cp -r /Docker/pdf-field-extractor/temp /backup/pdf-field-extractor-backup
```

**备份环境变量**：

```bash
cp .env /backup/env-backup
```

### Q8: 极空间 Docker 找不到创建入口？

**A**:

1. 确认极空间型号支持 Docker
2. 在应用中心搜索 "Docker"
3. 或查看极空间官方文档

---

## 📝 部署检查清单

部署前确认：

- [ ] 极空间已安装 Docker 应用
- [ ] 项目文件已上传到极空间
- [ ] `.env.docker` 文件已配置 Coze API 凭据
- [ ] 端口 5000 未被占用

部署后确认：

- [ ] 容器状态显示"运行中"
- [ ] 容器日志无错误
- [ ] 可以在浏览器访问 `http://极空间IP:5000`
- [ ] PDF 上传功能正常
- [ ] 字段提取功能正常
- [ ] Excel 下载功能正常

---

## 🎯 快速参考命令

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启容器
docker-compose restart

# 停止容器
docker-compose stop

# 删除容器
docker-compose down

# 进入容器
docker-compose exec pdf-field-extractor sh
```

---

## 🔗 相关文档

- [README.md](./README.md) - 项目主文档
- [Vercel 部署指南](./VERCEL_DEPLOYMENT.md) - Vercel 部署方案
- [Docker 官方文档](https://docs.docker.com/)

---

## 💡 下一步

部署成功后：

1. ✅ 测试 PDF 上传和解析功能
2. ✅ 配置外网访问（如需要）
3. ✅ 设置定期备份
4. ✅ 监控容器运行状态

祝你部署成功！🚀
