# 极空间部署 - 必需文件清单

## ✅ 需要导出的文件

### 根目录文件（必需）

```
项目根目录/
├── Dockerfile 或 Dockerfile.nas          # 选一个（根据你的极空间架构）
├── docker-compose.zima.yml              # 极空间专用配置
├── .dockerignore                        # Docker 构建优化
├── package.json                         # Node.js 依赖配置
├── pnpm-lock.yaml                       # 依赖锁文件
├── next.config.ts                       # Next.js 配置
├── src/                                 # 源代码目录（完整导出）
└── projects/pdf-field-extractor/        # Python 脚本目录（完整导出）
```

### 详细清单

#### 1. 根目录文件（8个文件/文件夹）

```
✅ Dockerfile.nas                # 极空间推荐（包含国内镜像源）
或 Dockerfile                    # 如果是 x86_64 架构使用这个

✅ docker-compose.zima.yml       # 极空间专用配置文件
✅ .dockerignore                 # Docker 构建忽略配置
✅ package.json                  # Node.js 依赖配置
✅ pnpm-lock.yaml                # 依赖版本锁定
✅ next.config.ts                # Next.js 配置
```

#### 2. src/ 目录（完整导出）

```
✅ src/
   ├── app/                      # Next.js 应用目录
   ├── components/               # React 组件
   └── lib/                      # 工具库
```

**重要：** `src/` 目录必须完整导出，包括所有子文件夹！

#### 3. projects/pdf-field-extractor/ 目录（完整导出）

```
✅ projects/pdf-field-extractor/
   ├── scripts/                  # Python 脚本
   │   ├── parse_pdf.py         # PDF 解析脚本
   │   └── export_to_excel.py   # Excel 导出脚本
   └── assets/                  # 资源文件
       └── template.xlsx        # Excel 模板
```

**重要：** `projects/pdf-field-extractor/` 目录必须完整导出！

---

## ❌ 不需要导出的文件

以下文件可以忽略，不需要导出到极空间：

```
❌ projects/assets/              # 根目录的 assets（模板已在 pdf-field-extractor/assets 里）
❌ projects/requirements.txt     # 多余的 Python 依赖文件
❌ projects/.coze               # 配置文件
❌ projects/.gitignore          # Git 配置文件
❌ .coze                        # 根目录配置
❌ .cozeproj                    # 配置目录
❌ scripts/                     # 根目录的脚本（构建脚本）
❌ node_modules/                # 依赖目录（构建时自动安装）
❌ .next/                       # 构建输出（构建时自动生成）
❌ README.md                    # 文档文件
❌ DOCKER_README.md            # 文档文件
❌ NAS_DOCKER_DEPLOYMENT.md    # 文档文件
❌ ZIMA_DEPLOYMENT.md          # 文档文件
❌ ZIMA_QUICKSTART.md          # 文档文件
❌ DEPLOYMENT_GUIDE.md         # 文档文件
❌ QUICK_REFERENCE.md          # 文档文件
❌ nas-deploy.sh               # 部署脚本（不需要）
```

---

## 📦 导出步骤

### 方法一：使用导出功能（推荐）

1. 在项目根目录打开文件管理器
2. 选中以下文件和文件夹：
   ```
   ✅ Dockerfile.nas
   ✅ docker-compose.zima.yml
   ✅ .dockerignore
   ✅ package.json
   ✅ pnpm-lock.yaml
   ✅ next.config.ts
   ✅ src/
   ✅ projects/pdf-field-extractor/
   ```
3. 压缩成 ZIP 文件（可选，方便上传）
4. 上传到极空间

### 方法二：手动复制

在项目根目录创建一个新文件夹 `deploy-zima`，然后复制：

```bash
# Linux/Mac
mkdir deploy-zima
cp Dockerfile.nas deploy-zima/
cp docker-compose.zima.yml deploy-zima/
cp .dockerignore deploy-zima/
cp package.json deploy-zima/
cp pnpm-lock.yaml deploy-zima/
cp next.config.ts deploy-zima/
cp -r src deploy-zima/
cp -r projects/pdf-field-extractor deploy-zima/projects/

# 压缩
cd deploy-zima
zip -r ../deploy-zima.zip .
```

---

## 🎯 最终上传到极空间的文件结构

上传到极空间后，应该有以下结构：

```
/docker/pdf-field-extractor/
├── Dockerfile.nas
├── docker-compose.zima.yml
├── .dockerignore
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── projects/
    └── pdf-field-extractor/
        ├── scripts/
        │   ├── parse_pdf.py
        │   └── export_to_excel.py
        └── assets/
            └── template.xlsx
```

---

## ✅ 验证清单

上传前，确认：

- [ ] 已选择 `Dockerfile.nas` 或 `Dockerfile`
- [ ] 已选择 `docker-compose.zima.yml`
- [ ] 已选择 `.dockerignore`
- [ ] 已选择 `package.json`
- [ ] 已选择 `pnpm-lock.yaml`
- [ ] 已选择 `next.config.ts`
- [ ] 已选择 `src/` 目录（完整）
- [ ] 已选择 `projects/pdf-field-extractor/` 目录（完整）
- [ ] 文件总数大约：**1-2 MB**

---

## 💡 提示

1. **不需要 node_modules**：Docker 构建时会自动安装依赖
2. **不需要 .next 目录**：构建时自动生成
3. **不需要文档文件**：只部署代码
4. **总大小约 1-2 MB**：包含所有必需文件

---

## 🚀 快速导出命令

如果你有 SSH 访问权限，可以用以下命令：

```bash
# 创建导出目录
mkdir -p /tmp/zima-deploy

# 复制必需文件
cp Dockerfile.nas /tmp/zima-deploy/
cp docker-compose.zima.yml /tmp/zima-deploy/
cp .dockerignore /tmp/zima-deploy/
cp package.json /tmp/zima-deploy/
cp pnpm-lock.yaml /tmp/zima-deploy/
cp next.config.ts /tmp/zima-deploy/
cp -r src /tmp/zima-deploy/
mkdir -p /tmp/zima-deploy/projects
cp -r projects/pdf-field-extractor /tmp/zima-deploy/projects/

# 压缩
cd /tmp/zima-deploy
zip -r /tmp/deploy-zima.zip .

# 下载 /tmp/deploy-zima.zip 文件
```

---

**总结：只需要导出 8 个文件/文件夹，总共约 1-2 MB！**
