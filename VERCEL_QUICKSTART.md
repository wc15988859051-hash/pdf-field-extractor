# Vercel 部署 - 快速开始 ⚡

## 🎯 5 分钟快速部署到 Vercel

### 前置准备

- [ ] GitHub 账号
- [ ] Vercel 账号（用 GitHub 登录）
- [ ] 项目代码已推送到 GitHub

---

## 📦 第一步：安装 JavaScript 依赖

在项目根目录执行：

```bash
pnpm add pdf-parse xlsx
pnpm add -D @types/pdf-parse
```

---

## 📝 第二步：修改前端代码

修改 `src/app/page.tsx`，将 API 跃点改为 Vercel 兼容版本：

```typescript
// 查找并替换：
// const response = await fetch('/api/parse-pdf', {
// 改为：
const response = await fetch('/api/parse-pdf-js', {
```

同样，修改下载 Excel 的 API：

```typescript
// 查找并替换：
// const response = await fetch('/api/export-excel', {
// 改为：
const response = await fetch('/api/export-excel-js', {
```

---

## 📤 第三步：推送到 GitHub

```bash
git add .
git commit -m "Add Vercel deployment support"
git push origin main
```

---

## 🚀 第四步：部署到 Vercel

### 方式一：通过 Vercel Dashboard（推荐）

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **Sign Up** 或 **Login**，使用 GitHub 登录
3. 点击 **Add New Project**
4. 在 **Import Git Repository** 中找到你的项目
5. 点击 **Import**

### 配置项目

在 **Configure Project** 页面：

**Project Settings:**
- **Name**: `pdf-field-extractor`（或自定义名称）
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`（保持默认）

**Build & Development Settings:**
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Dev Command**: `pnpm run dev`

**Environment Variables:**
（暂时不需要，点击跳过）

6. 点击 **Deploy**

7. 等待部署完成（通常 1-2 分钟）

8. 部署成功后，你会看到：
   ```
   🎉 Congratulations!
   Your project has been deployed
   ```

9. 点击访问 URL：`https://pdf-field-extractor-xxx.vercel.app`

---

## 🧪 第五步：测试部署

1. 打开部署后的 URL
2. 上传一个 PDF 文件
3. 检查字段提取结果
4. 下载 Excel 文件验证

---

## ⚙️ 可选配置

### 配置自定义域名

1. 在 Vercel Dashboard 进入你的项目
2. 点击 **Settings** → **Domains**
3. 添加你的域名（如 `pdf.yourdomain.com`）
4. 按照提示配置 DNS 记录

### 配置环境变量

如果需要配置环境变量：

1. 在 Vercel Dashboard 进入你的项目
2. 点击 **Settings** → **Environment Variables**
3. 添加变量：
   ```
   NEXT_PUBLIC_APP_NAME=PDF Field Extractor
   ```

---

## 🔄 自动部署

配置完成后，每次推送代码到 GitHub，Vercel 会自动重新部署：

```bash
# 修改代码后
git add .
git commit -m "Update feature"
git push origin main

# Vercel 会自动构建和部署
```

---

## 🐛 常见问题

### 问题 1: 构建失败

**错误信息:**
```
Error: Cannot find module 'pdf-parse'
```

**解决方案:**
```bash
# 确保已安装依赖
pnpm add pdf-parse xlsx

# 提交 package.json 和 pnpm-lock.yaml
git add package.json pnpm-lock.yaml
git commit -m "Add dependencies"
git push
```

### 问题 2: API 超时

**可能原因:**
- 文件太大
- LLM 响应慢

**解决方案:**
- 限制文件大小（已在代码中设置为 5MB）
- 使用更小的 PDF 文件测试

### 问题 3: 下载 Excel 失败

**检查:**
- [ ] 是否有数据导出
- [ ] API 路径是否正确（`/api/export-excel-js`）
- [ ] 浏览器控制台是否有错误

---

## 📊 Vercel 免费额度

- **带宽**: 100 GB/月
- **构建时间**: 6,000 分钟/月
- **Serverless Function**: 100 GB/小时

对于本项目的使用场景，免费额度完全够用！

---

## 🎉 完成！

部署成功后：

✅ 访问应用：`https://your-app.vercel.app`
✅ 上传 PDF 测试功能
✅ 下载 Excel 验证数据
✅ 分享链接给他人使用

---

## 📚 详细文档

- **完整部署指南**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Vercel 官方文档**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js 部署**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## 💡 提示

1. **首次部署**: 可能需要 2-3 分钟
2. **后续部署**: 推送代码后自动部署，约 1-2 分钟
3. **查看日志**: 在 Vercel Dashboard → Functions 查看 API 日志
4. **回滚部署**: 在 Deployments 页面可以回滚到之前的版本

---

**快速部署版本 | 5 分钟完成 Vercel 部署**

祝你部署成功！🚀
