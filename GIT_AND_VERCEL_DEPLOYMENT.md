# Git 仓库配置和 Vercel 部署指南

## 📋 目录

- [第一步：创建 Git 远程仓库](#第一步创建-git-远程仓库)
- [第二步：连接本地仓库到远程仓库](#第二步连接本地仓库到远程仓库)
- [第三步：推送代码到远程仓库](#第三步推送代码到远程仓库)
- [第四步：在 Vercel 中连接 Git 仓库](#第四步在-vercel-中连接-git-仓库)
- [第五步：配置环境变量](#第五步配置环境变量)
- [第六步：部署到 Vercel](#第六步部署到-vercel)
- [常见问题](#常见问题)

---

## 第一步：创建 Git 远程仓库

### 选择 Git 平台

你可以选择以下任一 Git 平台：

| 平台 | 网址 | 推荐度 |
|------|------|--------|
| **GitHub** | https://github.com | ⭐⭐⭐⭐⭐ |
| **GitLab** | https://gitlab.com | ⭐⭐⭐⭐ |
| **Bitbucket** | https://bitbucket.org | ⭐⭐⭐ |

**推荐使用 GitHub**，因为 Vercel 与 GitHub 的集成最完善。

### 创建新仓库（以 GitHub 为例）

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `pdf-field-extractor`（或你喜欢的名称）
   - **Description**: PDF 字段提取与 Excel 导出工具
   - **Public/Private**: 选择 **Private**（私密）或 **Public**（公开）
   - **不要勾选** "Add a README file"（本地已有 README.md）
   - **不要勾选** "Add .gitignore"（本地已有 .gitignore）
   - **不要勾选** "Choose a license"（稍后可添加）
3. 点击 **Create repository** 按钮

创建完成后，你会看到仓库的 URL，格式类似：
```
https://github.com/YOUR_USERNAME/pdf-field-extractor.git
```

**保存这个 URL**，下一步会用到。

---

## 第二步：连接本地仓库到远程仓库

### 方法 1：使用 HTTPS（推荐新手）

```bash
cd /workspace/projects
git remote add origin https://github.com/YOUR_USERNAME/pdf-field-extractor.git
```

### 方法 2：使用 SSH（推荐有经验者）

如果你已经配置了 SSH 密钥：

```bash
cd /workspace/projects
git remote add origin git@github.com:YOUR_USERNAME/pdf-field-extractor.git
```

### 验证远程仓库

```bash
git remote -v
```

你应该看到类似输出：
```
origin  https://github.com/YOUR_USERNAME/pdf-field-extractor.git (fetch)
origin  https://github.com/YOUR_USERNAME/pdf-field-extractor.git (push)
```

---

## 第三步：推送代码到远程仓库

### 首次推送

```bash
cd /workspace/projects
git branch -M main
git push -u origin main
```

如果使用 HTTPS，可能会提示输入 GitHub 用户名和密码（或 Personal Access Token）。

### 后续推送

```bash
git push
```

### 推送成功后

访问你的 GitHub 仓库页面（如：https://github.com/YOUR_USERNAME/pdf-field-extractor），你应该能看到：
- ✅ 所有源代码文件
- ✅ README.md
- ✅ Vercel 部署文档
- ✅ 提交历史记录

---

## 第四步：在 Vercel 中连接 Git 仓库

### 1. 登录 Vercel

访问 https://vercel.com 并登录（推荐使用 GitHub 账号登录）。

### 2. 创建新项目

1. 点击右上角的 **"Add New"** → **"Project"**
2. 你会看到 "Import Git Repository" 页面

### 3. 连接 Git 仓库

1. 在仓库列表中找到 `pdf-field-extractor` 仓库
2. 点击仓库旁边的 **"Import"** 按钮

### 4. 配置项目

在 "Configure Project" 页面，确认以下设置：

#### Framework Preset
- **自动检测**: Next.js ✅

#### Root Directory
- 保持默认: `./`

#### Build Command
- **自动检测**: `pnpm install && pnpm build` ✅

#### Output Directory
- **自动检测**: `.next` ✅

#### Install Command
- **自动检测**: `pnpm install` ✅

### 5. 环境变量（暂时跳过）

点击 **"Environment Variables"** 展开，但暂时不需要添加（下一步会配置）。

### 6. 部署区域（可选）

- **默认**: `iad1` (美国东部)
- **可选**: `hkg1` (香港) 或 `sin1` (新加坡) - 亚洲用户推荐

### 7. 开始部署

点击底部的 **"Deploy"** 按钮。

⚠️ **注意**：首次部署可能会失败，因为还没有配置环境变量。这是正常的。

---

## 第五步：配置环境变量

### 1. 进入项目设置

部署完成后（或失败后），点击 **"Continue to Dashboard"** 进入项目仪表板。

### 2. 添加环境变量

1. 在左侧菜单点击 **"Settings"** → **"Environment Variables"**
2. 点击 **"Add New"** 按钮
3. 依次添加以下环境变量：

#### 必需的环境变量

| Key | Value | Environment |
|-----|-------|-------------|
| `COZE_API_KEY` | 从 Coze 平台获取 | **Production**, **Preview**, **Development** |
| `COZE_BASE_URL` | `https://api.coze.com` | **Production**, **Preview**, **Development** |
| `COZE_BOT_ID` | 从 Coze 平台获取 | **Production**, **Preview**, **Development** |

#### 如何获取 Coze API 密钥？

1. 访问 https://www.coze.cn/ 或 https://www.coze.com/
2. 登录或注册账号
3. 创建或选择一个 Bot
4. 进入 Bot 设置页面，找到 API 密钥和 Bot ID
5. 复制到 Vercel 环境变量中

### 3. 保存环境变量

添加完所有环境变量后，点击 **"Save"** 按钮。

---

## 第六步：部署到 Vercel

### 触发重新部署

配置完环境变量后，需要触发一次重新部署：

#### 方法 1：从 Vercel 仪表板（推荐）

1. 进入 **"Deployments"** 页面
2. 找到最新的部署记录
3. 点击右侧的 **"..."** 菜单
4. 选择 **"Redeploy"**

#### 方法 2：从 Git 推送（推荐持续使用）

```bash
# 修改代码后
git add .
git commit -m "update: 配置环境变量"
git push
```

Vercel 会自动检测到新的推送，并触发重新部署。

### 查看部署状态

在 Vercel 仪表板的 **"Deployments"** 页面，你可以看到：
- 🟢 **Building** - 构建中
- 🟢 **Ready** - 部署成功
- 🔴 **Error** - 部署失败

### 部署成功后

你会看到：
- ✅ **Preview URL**: 如 `https://pdf-field-extractor-xyz.vercel.app`
- ✅ **Production URL**: 如 `https://pdf-field-extractor.vercel.app`

点击任意 URL 访问你的应用。

---

## 常见问题

### Q1: 推送时提示 "Permission denied"

**A**: 如果你使用 HTTPS，可能需要配置 GitHub Personal Access Token：

1. 访问 https://github.com/settings/tokens
2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
3. 选择权限：`repo`（完整仓库访问权限）
4. 生成并复制 token
5. 在推送时，密码处粘贴 token（不是 GitHub 密码）

### Q2: Vercel 部署失败，提示 "Module not found"

**A**: 检查以下几点：

1. 确认 `package.json` 中列出了所有依赖
2. 确认 `requirements.txt` 文件存在（如果使用 Python）
3. 查看部署日志，找到具体错误信息

### Q3: Vercel 部署失败，提示 "Environment variable not set"

**A**: 确保在 Vercel 项目设置中添加了所有必需的环境变量：
- `COZE_API_KEY`
- `COZE_BASE_URL`
- `COZE_BOT_ID`

### Q4: 如何查看部署日志？

**A**:

1. 进入 Vercel 项目的 **"Deployments"** 页面
2. 点击任意部署记录
3. 点击 **"Build Logs"** 或 **"Function Logs"** 查看日志

### Q5: 如何回滚到之前的版本？

**A**:

1. 进入 **"Deployments"** 页面
2. 找到要回滚的部署记录
3. 点击右侧的 **"..."** 菜单
4. 选择 **"Promote to Production"**

### Q6: 如何配置自定义域名？

**A**:

1. 进入项目 **"Settings"** → **"Domains"**
2. 点击 **"Add"** 按钮
3. 输入你的域名（如 `pdf.example.com`）
4. 按照提示配置 DNS 记录

### Q7: 如何配置自动部署？

**A**: Vercel 默认已经配置了自动部署：

- 🔄 推送到 `main` 分支 → 自动部署到 **Production**
- 🔄 推送到其他分支 → 自动部署到 **Preview**

### Q8: Python 脚本在 Vercel 上无法运行？

**A**: Vercel Serverless Functions 默认是 Node.js 环境。你有两个选择：

1. **方案 A（推荐）**: 迁移到 Node.js
   - 查看 `VERCEL_DEPLOYMENT.md` 中的详细步骤
   - 使用 `pdf-parse` 和 `exceljs` 替代 Python 脚本

2. **方案 B**: 使用 Vercel Python Runtime
   - 需要将 API 路由重写为 Python 函数
   - 配置 `vercel.json` 启用 Python 构建
   - 查看更多细节在 `VERCEL_DEPLOYMENT.md`

---

## 🎯 快速参考命令

### Git 常用命令

```bash
# 查看状态
git status

# 查看远程仓库
git remote -v

# 添加文件
git add .

# 提交更改
git commit -m "描述信息"

# 推送到远程
git push

# 拉取最新更改
git pull

# 查看提交历史
git log --oneline

# 查看分支
git branch

# 切换分支
git checkout branch-name
```

### Vercel CLI 命令

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 链接到现有项目
vercel link

# 本地预览（模拟 Vercel 环境）
vercel

# 部署到生产环境
vercel --prod

# 查看部署日志
vercel logs
```

---

## 📝 总结

### 完整流程

1. ✅ 在 GitHub/GitLab/Bitbucket 创建远程仓库
2. ✅ 连接本地仓库到远程仓库
3. ✅ 推送代码到远程仓库
4. ✅ 在 Vercel 导入 Git 仓库
5. ✅ 配置环境变量
6. ✅ 部署到 Vercel

### 自动部署配置完成

现在，每次你推送代码到 Git 仓库，Vercel 会自动：
1. 检测到新的推送
2. 拉取最新代码
3. 安装依赖
4. 构建项目
5. 部署到 Preview 或 Production 环境

---

## 🔗 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel Git 集成](https://vercel.com/docs/concepts/git)
- [GitHub 官方文档](https://docs.github.com)
- [项目部署指南](./VERCEL_DEPLOYMENT.md)
- [快速部署指南](./DEPLOYMENT_QUICK_START.md)

---

## 💡 下一步

1. ✅ 完成代码迁移（如果使用 Python）
2. ✅ 配置环境变量
3. ✅ 部署到 Vercel
4. ✅ 测试所有功能
5. ✅ 配置自定义域名（可选）
6. ✅ 配置监控和日志（可选）

祝你部署成功！🚀
