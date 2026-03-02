# ==============================================
# PDF 字段提取应用 - 极空间 NAS 部署指南
# ==============================================

## 📋 项目概述

这是一个基于 Next.js 的 PDF 字段提取应用，可以将 PDF 文件中的业务字段提取并导出到 Excel 文件中。

### 功能特性
- 📄 PDF 文件上传和解析
- 🤖 AI 智能字段提取（使用豆包 LLM）
- 📊 Excel 全局合并导出
- 💾 历史记录查看
- 🔄 实时处理进度显示

---

## 🚀 部署前准备

### 1. 准备项目文件

首先，将以下文件打包或复制到你的极空间 NAS：

```
项目根目录/
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
├── .dockerignore          # Docker 构建忽略文件
├── requirements.txt        # Python 依赖
├── package.json            # Node.js 依赖
├── pnpm-lock.yaml         # pnpm 锁文件（如果有）
├── next.config.ts         # Next.js 配置
├── tsconfig.json          # TypeScript 配置
├── postcss.config.mjs     # PostCSS 配置
├── tailwind.config.ts     # Tailwind CSS 配置
├── src/                   # 源代码目录
│   └── app/
│       ├── api/
│       ├── page.tsx
│       └── layout.tsx
└── projects/              # Python 脚本
    └── pdf-field-extractor/
        ├── scripts/
        └── assets/
```

### 2. 确认极空间 NAS 环境

确保你的极空间 NAS 已满足以下条件：

✅ 已安装 Docker（图形化版本）
✅ NAS 已连接到互联网
✅ 有足够的存储空间（建议至少 2GB 可用空间）
✅ 有足够的内存（建议至少 2GB 可用内存）

---

## 📦 方法一：使用 Docker Compose 部署（推荐）

### 步骤 1：将项目文件上传到 NAS

1. 在极空间 NAS 上创建一个目录，例如：
   ```
   /Docker/pdf-extractor/
   ```

2. 将所有项目文件上传到该目录

### 步骤 2：在极空间 Docker 中创建 Compose 项目

1. 打开极空间 NAS 的 Docker 应用
2. 点击「项目」标签
3. 点击「添加」按钮
4. 选择「从文件导入」或「从文件夹导入」
5. 选择刚才上传的项目目录 `/Docker/pdf-extractor/`
6. 确认 `docker-compose.yml` 文件被正确识别
7. 点击「下一步」或「创建」

### 步骤 3：配置项目（可选）

在创建项目前，你可以根据需要修改配置：

#### 修改端口映射（如果 5000 端口已被占用）

编辑 `docker-compose.yml`，修改端口映射：
```yaml
ports:
  - "8080:5000"  # 将主机端口改为 8080
```

#### 修改资源限制

根据你的 NAS 配置修改内存限制：
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # 增加到 4GB
    reservations:
      memory: 1G
```

### 步骤 4：启动项目

1. 确认配置无误后，点击「创建」或「启动」
2. 等待 Docker 镜像构建完成（首次构建可能需要 5-15 分钟）
3. 构建完成后，容器会自动启动

### 步骤 5：验证部署

1. 在 Docker 应用的「容器」标签中，确认 `pdf-extractor-app` 容器状态为「运行中」
2. 打开浏览器，访问：`http://你的NAS_IP:5000`
3. 如果看到 PDF 提取应用界面，说明部署成功！

---

## 🐳 方法二：使用 Dockerfile 手动构建

### 步骤 1：上传项目文件

将所有项目文件上传到 NAS 的某个目录，例如：
```
/Docker/pdf-extractor/
```

### 步骤 2：构建 Docker 镜像

由于极空间使用图形化 Docker，建议使用方法一的 Compose 方式。

如果需要手动构建：

1. 在极空间 Docker 中，点击「镜像」标签
2. 点击「添加」→「从 Dockerfile 构建」
3. 选择项目目录
4. 命名镜像为：`pdf-extractor:latest`
5. 点击「构建」

### 步骤 3：创建并运行容器

1. 镜像构建完成后，点击「创建容器」
2. 配置容器：
   - **名称**：`pdf-extractor-app`
   - **端口**：添加端口映射 `5000:5000`
   - **卷**：添加数据卷（可选）
   - **重启策略**：选择「除非停止，否则总是重启」
3. 点击「创建」并启动

---

## 🌐 域名配置：def-sheild.tech

### 前置条件

✅ 已购买域名 `def-sheild.tech`
✅ 极空间 NAS 有公网 IP 或使用内网穿透
✅ 已在域名服务商处配置 DNS

### 方案一：使用极空间自带的反向代理（推荐）

#### 1. 配置端口转发或内网穿透

确保外部可以访问到 NAS 的 5000 端口：

**如果你有公网 IP：**
- 在路由器上配置端口转发：外部端口 80/443 → NAS IP:5000

**如果使用内网穿透（如 frp、ngrok 等）：**
- 配置穿透规则，将域名指向 NAS 的 5000 端口

#### 2. 在域名服务商配置 DNS

登录你的域名管理面板（如阿里云、腾讯云、Cloudflare 等）：

添加 A 记录或 CNAME 记录：
```
类型: A 记录
主机记录: @ 或 www
记录值: 你的公网 IP 或内网穿透地址
TTL: 600
```

如果使用极空间的 DDNS：
```
类型: CNAME
主机记录: @
记录值: 你的极空间 DDNS 域名
TTL: 600
```

#### 3. 配置极空间反向代理

1. 打开极空间的「控制面板」→「网络」→「反向代理」
2. 点击「添加」
3. 配置反向代理规则：
   - **来源协议**：HTTPS（推荐）或 HTTP
   - **来源主机名**：`def-sheild.tech`
   - **来源端口**：443（HTTPS）或 80（HTTP）
   - **目标协议**：HTTP
   - **目标主机名**：`localhost` 或 `127.0.0.1`
   - **目标端口**：`5000`
4. 点击「确定」保存

#### 4. 配置 SSL 证书（可选但推荐）

为了使用 HTTPS，你需要配置 SSL 证书：

**方式 A：使用极空间自带的 Let's Encrypt 证书**
1. 在反向代理设置中，开启「自动获取 Let's Encrypt 证书」
2. 填写邮箱地址
3. 保存并等待证书申请完成

**方式 B：使用自己的 SSL 证书**
1. 在极空间「控制面板」→「安全性」→「SSL 证书」
2. 上传你的证书文件（.crt 或 .pem）和私钥文件（.key）
3. 在反向代理中选择使用该证书

---

### 方案二：使用第三方反向代理工具

如果极空间没有内置反向代理功能，可以使用以下工具：

#### 使用 Nginx Proxy Manager（推荐）

1. 在极空间 Docker 中安装 Nginx Proxy Manager
2. 配置代理规则：
   - **域名**：`def-sheild.tech`
   - **Scheme**：`http`
   - **Forward Hostname/IP**：`pdf-extractor-app`（容器名）或 NAS IP
   - **Forward Port**：`5000`
3. 在 SSL 标签中申请 Let's Encrypt 证书

---

## 🔧 Docker 依赖库说明

### Python 依赖

我们的项目只需要两个 Python 库，这些会在 Docker 构建时自动安装：

| 库名 | 版本 | 用途 | 安装方式 |
|------|------|------|----------|
| PyMuPDF | 1.23.26 | PDF 文件解析 | Dockerfile 自动安装 |
| openpyxl | 3.1.5 | Excel 文件生成 | Dockerfile 自动安装 |

**不需要在 Docker 中手动安装！** Docker 构建时会自动通过 `pip install` 安装。

### Node.js 依赖

Node.js 依赖通过 `pnpm install` 安装，也会在 Docker 构建时自动完成。

---

## 📊 容器管理

### 查看容器状态

在极空间 Docker 应用中：
1. 点击「容器」标签
2. 找到 `pdf-extractor-app` 容器
3. 查看状态：运行中 / 已停止 / 错误

### 查看日志

1. 在容器列表中，点击 `pdf-extractor-app`
2. 点击「日志」标签
3. 查看应用运行日志

### 重启容器

如果应用出现问题，可以尝试重启：
1. 在容器列表中，选择 `pdf-extractor-app`
2. 点击「重启」按钮

### 停止/启动容器

1. 在容器列表中，选择 `pdf-extractor-app`
2. 点击「停止」或「启动」按钮

---

## 🔄 更新应用

### 更新步骤

1. 将最新的项目文件上传到 NAS 的项目目录
2. 在极空间 Docker 中：
   - 方法 A（Compose）：在「项目」中找到项目，点击「重新构建」
   - 方法 B（手动）：删除旧容器和镜像，重新构建

### 数据备份

在更新前，建议备份数据：

1. 备份 Docker 卷（如果使用了数据卷）
2. 或复制 `/tmp/extracted/` 目录下的 Excel 文件

---

## ❓ 常见问题

### Q1: Docker 镜像构建太慢怎么办？

**A:** 
- 确保 NAS 网络连接正常
- 可以考虑使用国内镜像源（需要修改 Dockerfile）
- 首次构建较慢是正常的，后续构建会利用缓存

### Q2: 容器启动后访问不了？

**A:** 检查以下几点：
1. 确认容器状态为「运行中」
2. 检查端口映射是否正确
3. 查看容器日志是否有错误
4. 确认 NAS 防火墙没有阻止 5000 端口

### Q3: 如何修改应用端口？

**A:** 编辑 `docker-compose.yml`：
```yaml
ports:
  - "8080:5000"  # 左边是主机端口，右边是容器端口
```
然后重新构建项目。

### Q4: 数据会丢失吗？

**A:** 
- 如果使用了 Docker 数据卷（volumes），数据会持久化
- 建议定期备份重要的 Excel 文件
- 容器重启不会影响数据卷中的数据

### Q5: 如何配置 LLM API Key？

**A:** 
1. 编辑 `docker-compose.yml`
2. 在 `environment` 部分添加：
   ```yaml
   environment:
     - COZE_API_KEY=your_api_key_here
   ```
3. 重启容器

---

## 📞 技术支持

如果遇到问题：

1. 首先查看容器日志
2. 检查极空间 Docker 的「事件」标签
3. 确认 NAS 资源（内存、存储空间）充足
4. 参考本文档的「常见问题」部分

---

## 🎉 部署成功后

部署成功后，你可以：

1. 📱 通过 `http://def-sheild.tech` 访问应用
2. 📄 上传 PDF 文件进行字段提取
3. 📊 下载合并后的 Excel 文件
4. 💾 查看上传历史记录

祝你使用愉快！🚀
