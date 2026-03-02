# 🚀 快速开始：通过 Git 部署到 Vercel

## 步骤概览

1. [创建 Git 远程仓库](#1-创建-git-远程仓库)
2. [连接本地仓库](#2-连接本地仓库)
3. [推送代码](#3-推送代码)
4. [Vercel 部署](#4-vercel-部署)

---

## 1. 创建 Git 远程仓库

### 在 GitHub 创建仓库

访问 https://github.com/new，创建一个新仓库：

- **Repository name**: `pdf-field-extractor`
- **Public/Private**: 选择你想要的
- **不要勾选**任何初始化选项（README、.gitignore、License）

创建完成后，复制仓库 URL：
```
https://github.com/YOUR_USERNAME/pdf-field-extractor.git
```

---

## 2. 连接本地仓库

```bash
cd /workspace/projects
git remote add origin https://github.com/YOUR_USERNAME/pdf-field-extractor.git
```

验证：
```bash
git remote -v
```

---

## 3. 推送代码

```bash
git branch -M main
git push -u origin main
```

**如果是第一次推送，可能需要输入 GitHub 用户名和密码（或 Personal Access Token）**

---

## 4. Vercel 部署

### 4.1 连接 Git 仓库

1. 访问 https://vercel.com 并登录（推荐用 GitHub 账号）
2. 点击 **"Add New"** → **"Project"**
3. 找到 `pdf-field-extractor` 仓库，点击 **"Import"**

### 4.2 配置项目

Vercel 会自动检测 Next.js 项目，直接点击 **"Deploy"** 即可。

⚠️ **首次部署可能会失败，因为还没有配置环境变量。这是正常的。**

### 4.3 配置环境变量

1. 进入项目 **"Settings"** → **"Environment Variables"**
2. 添加以下环境变量：

| Key | Value |
|-----|-------|
| `COZE_API_KEY` | 从 Coze 平台获取 |
| `COZE_BASE_URL` | `https://api.coze.com` |
| `COZE_BOT_ID` | 从 Coze 平台获取 |

3. 点击 **"Save"**

### 4.4 重新部署

1. 进入 **"Deployments"** 页面
2. 找到最新的部署
3. 点击 **"..."** → **"Redeploy"**

或推送新代码触发自动部署：
```bash
git commit --allow-empty -m "trigger: 配置环境变量后重新部署"
git push
```

### 4.5 访问应用

部署成功后，你会看到：
- **Preview URL**: `https://pdf-field-extractor-xyz.vercel.app`
- **Production URL**: `https://pdf-field-extractor.vercel.app`

---

## ⚠️ 重要提示

### 关于 Python 脚本

当前项目使用了 Python 脚本（`parse_pdf.py`、`export_to_excel.py`），**无法直接在 Vercel 上运行**。

你有两个选择：

#### 方案 A：迁移到 Node.js（推荐 ⭐⭐⭐⭐⭐）

1. 安装依赖：
```bash
pnpm add pdf-parse exceljs
```

2. 创建 Node.js 工具函数：
   - `src/lib/pdf-parser.ts`
   - `src/lib/excel-exporter.ts`

3. 更新 API 路由，使用 Node.js 函数替代 Python 调用

4. 部署到 Vercel

📖 详细步骤：查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

#### 方案 B：使用其他部署平台

如果必须使用 Python，考虑：
- **Railway** - 支持 Python 和 Node.js
- **Render** - 支持 Python 和 Node.js
- **Heroku** - 支持 Python 和 Node.js

---

## 📖 详细文档

- [完整部署指南](./GIT_AND_VERCEL_DEPLOYMENT.md) - 详细的步骤和常见问题
- [Vercel 部署方案](./VERCEL_DEPLOYMENT.md) - Node.js vs Python 方案对比
- [快速部署指南](./DEPLOYMENT_QUICK_START.md) - 快速参考

---

## 🎯 一键命令清单

```bash
# 连接远程仓库
git remote add origin https://github.com/YOUR_USERNAME/pdf-field-extractor.git

# 推送代码
git push -u origin main

# 后续更新
git add .
git commit -m "update: 更新内容"
git push
```

---

## ❓ 需要帮助？

- 查看 [GIT_AND_VERCEL_DEPLOYMENT.md](./GIT_AND_VERCEL_DEPLOYMENT.md) 了解常见问题
- 查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) 了解代码迁移步骤

---

## 🎉 完成！

现在你的项目已经连接到 Git，并且可以通过 Vercel 部署了。

每次推送代码到 `main` 分支，Vercel 会自动重新部署！

祝你部署成功！🚀
