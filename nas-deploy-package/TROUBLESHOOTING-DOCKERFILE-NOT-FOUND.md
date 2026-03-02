# 简化的 Docker 配置（适用于不兼容的 Docker 管理工具）

如果你的 Docker 管理工具无法识别复杂的 docker-compose.yml 配置，请使用这个简化版本。

---

## 📝 简化版 docker-compose.yml

将以下内容替换 `/volume1/docker/pdf-extractor/docker-compose.yml`：

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

**说明**：
- 移除了 `version`（避免警告）
- 简化了 volumes 配置（直接路径映射）
- 移除了 healthcheck（某些 Docker 工具不支持）
- 移除了 networks（使用默认网络）

---

## 🔍 检查文件是否完整

请检查以下文件是否存在（在 `/volume1/docker/pdf-extractor/` 目录下）：

### 必需文件
```
✓ Dockerfile              （必须存在，大小 > 0）
✓ docker-compose.yml      （使用上面的简化版本）
✓ package.json            （必须存在）
✓ next.config.ts          （必须存在）
```

### 必需目录
```
✓ src/                    （必须存在，包含 app/ 目录）
  └── app/
      ├── api/
      │   ├── parse-pdf/
      │   │   └── route.ts
      │   └── export-excel/
      │       └── route.ts
      └── page.tsx

✓ projects/               （必须存在）
  └── pdf-field-extractor/
      ├── scripts/
      │   ├── parse_pdf.py
      │   └── export_to_excel.py
      └── assets/
          └── template.xlsx
```

### 数据目录（需要在 NAS 上创建）
```
✓ data/                   （空目录，用于存储 Excel 文件）
✓ temp/                   （空目录，用于临时文件）
```

---

## 📋 文件检查清单

请在 NAS 文件管理器中逐一检查：

```
☐ /volume1/docker/pdf-extractor/Dockerfile 存在
☐ /volume1/docker/pdf-extractor/Dockerfile 大小 > 0 字节
☐ /volume1/docker/pdf-extractor/docker-compose.yml 存在
☐ /volume1/docker/pdf-extractor/package.json 存在
☐ /volume1/docker/pdf-extractor/next.config.ts 存在
☐ /volume1/docker/pdf-extractor/src/ 目录存在
☐ /volume1/docker/pdf-extractor/src/app/ 目录存在
☐ /volume1/docker/pdf-extractor/projects/ 目录存在
☐ /volume1/docker/pdf-extractor/data/ 目录存在
☐ /volume1/docker/pdf-extractor/temp/ 目录存在
```

---

## 🔄 重新操作步骤

### 1. 删除现有项目
1. 在 Docker 管理界面
2. 找到 `pdf-extractor` Compose 项目
3. 删除它（包括容器和镜像）

### 2. 检查并修复文件
1. 打开 NAS 文件管理器
2. 进入 `/volume1/docker/pdf-extractor/`
3. 确认所有文件都存在
4. 如果缺少文件，重新上传

### 3. 使用简化配置
1. 将上面的简化版 docker-compose.yml 内容复制
2. 替换 NAS 上的 `/volume1/docker/pdf-extractor/docker-compose.yml`
3. 保存文件

### 4. 重新创建项目
1. 打开 Docker 管理界面
2. 点击 "Compose" 菜单
3. 点击 "创建"
4. 填写：
   - 项目名称：`pdf-extractor`
   - 路径：`/volume1/docker/pdf-extractor`
   - 文件：`docker-compose.yml`
5. 点击 "保存"

### 5. 重新构建
1. 在 Compose 项目列表中找到 `pdf-extractor`
2. 点击 "..." 或 "操作"
3. 选择 "构建" 或 "Build"
4. 等待完成

---

## 🚨 如果还是找不到 Dockerfile

如果问题依然存在，可能是你的 Docker 管理工具的问题。尝试以下方法：

### 方法 A：使用镜像仓库（不推荐，复杂）

不使用构建，而是使用预构建的镜像。但这需要你有 Docker Hub 账号。

### 方法 B：手动构建（推荐）

如果 Docker 管理工具的 Compose 功能有问题，你可以尝试手动构建：

1. **下载 Docker 镜像**
   - 在 Docker 管理界面的"镜像"菜单
   - 搜索并下载：`node:20-alpine`

2. **创建容器（手动方式）**
   - 在 Docker 管理界面点击"容器"菜单
   - 点击"创建"
   - 选择"自定义容器"
   - 镜像：选择 `node:20-alpine`
   - 卷映射：
     - `/volume1/docker/pdf-extractor` → `/app`
     - `/volume1/docker/pdf-extractor/data` → `/tmp/extracted`
     - `/volume1/docker/pdf-extractor/temp` → `/tmp/pdfs`
   - 端口：`5000:5000`
   - 环境变量：
     - `NODE_ENV` = `production`
     - `PORT` = `5000`
   - 命令：
     - `/bin/sh -c "cd /app && npm install -g pnpm && pnpm install && pnpm run build && pnpm run start"`

3. **启动容器**
   - 点击"启动"
   - 等待依赖安装和构建（约 10-15 分钟）

---

## 💡 最可能的解决方案

根据错误信息，90% 的原因是：

**Dockerfile 文件没有正确上传或文件名不对**

请重点检查：
1. Dockerfile 是否存在
2. 文件名是否是 `Dockerfile`（不是 dockerfile 或 Dockerfile.txt）
3. 文件大小是否大于 0 字节
4. 是否在正确的目录 `/volume1/docker/pdf-extractor/`

---

## 📞 需要进一步帮助？

如果尝试以上方法后问题依然存在，请告诉我：

1. 你的 NAS 文件管理器中 `/volume1/docker/pdf-extractor/` 目录下有哪些文件？
2. Dockerfile 文件的大小是多少？
3. 你使用的是什么 NAS 系统（群晖、QNAP 等）？
4. Docker 管理工具的版本是多少？

我会帮你进一步排查！
