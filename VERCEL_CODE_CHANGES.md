# Vercel 部署代码修改指南

要将项目部署到 Vercel，需要修改以下代码。

---

## 📝 需要修改的文件

### 1. 安装依赖（必需）

在项目根目录执行：

```bash
pnpm add pdf-parse xlsx
```

---

### 2. 修改前端 API 跃点

打开 `src/app/page.tsx`，找到以下代码并修改：

#### 修改 1: PDF 解析 API

**查找:**
```typescript
const response = await fetch('/api/parse-pdf', {
```

**替换为:**
```typescript
const response = await fetch('/api/parse-pdf-js', {
```

#### 修改 2: Excel 导出 API

**查找:**
```typescript
const response = await fetch('/api/export-excel', {
```

**替换为:**
```typescript
const response = await fetch('/api/export-excel-js', {
```

---

## 🎯 完整修改示例

### 在 handleFileUpload 函数中

**原代码:**
```typescript
const response = await fetch('/api/parse-pdf', {
  method: 'POST',
  body: formData,
});
```

**修改为:**
```typescript
const response = await fetch('/api/parse-pdf-js', {
  method: 'POST',
  body: formData,
});
```

### 在 downloadGlobalExcel 函数中

**原代码:**
```typescript
const response = await fetch('/api/export-excel');
```

**修改为:**
```typescript
const response = await fetch('/api/export-excel-js');
```

---

## 📋 修改清单

- [ ] 安装 pdf-parse 和 xlsx 依赖
- [ ] 修改 `/api/parse-pdf` 为 `/api/parse-pdf-js`
- [ ] 修改 `/api/export-excel` 为 `/api/export-excel-js`

---

## ✅ 验证修改

修改完成后：

1. 本地测试：
   ```bash
   pnpm install
   pnpm dev
   ```

2. 访问 `http://localhost:5000`

3. 上传 PDF 测试功能

4. 如果一切正常，提交代码：
   ```bash
   git add .
   git commit -m "Add Vercel support"
   git push
   ```

---

## 💡 说明

### 为什么要修改？

Vercel 不支持 Python 运行时，因此：

- `/api/parse-pdf` → 使用 Python 脚本（不兼容 Vercel）
- `/api/parse-pdf-js` → 使用 JavaScript 实现（兼容 Vercel）

### 已创建的 Vercel 兼容 API

1. `/api/parse-pdf-js` - PDF 解析和字段提取
2. `/api/export-excel-js` - Excel 导出

这两个 API 使用纯 JavaScript 实现，可以在 Vercel 上运行。

---

## 🚀 下一步

修改完成后，查看 [VERCEL_QUICKSTART.md](./VERCEL_QUICKSTART.md) 开始部署到 Vercel。

---

**注意：** 如果选择 Docker 或极空间部署，不需要修改代码，继续使用原有的 `/api/parse-pdf` 和 `/api/export-excel` 即可。
