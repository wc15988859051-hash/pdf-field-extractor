# Vercel 部署指南

本指南介绍如何将 PDF 字段提取应用部署到 Vercel。

---

## ⚠️ 重要说明

### Vercel 限制

**Vercel 不支持 Python 运行时**，因此本项目中的 Python 脚本需要转换为 JavaScript/TypeScript 才能在 Vercel 上运行。

---

## 🎯 部署方案

### 方案 A：纯 JavaScript 实现（推荐）

**优点：**
- ✅ 完全在 Vercel 上运行
- ✅ 无需额外服务
- ✅ 部署简单
- ✅ 免费额度充足

**缺点：**
- ❌ PDF 解析功能有限（无 PyMuPDF）
- ❌ Excel 生成需要额外配置

**适用场景：**
- 简单 PDF 文件处理
- 不需要高级 PDF 解析功能

### 方案 B：Python 后端分离部署

**优点：**
- ✅ 保留所有 Python 功能
- ✅ PDF 解析功能完整
- ✅ Excel 生成功能完整

**缺点：**
- ❌ 需要额外部署 Python 后端
- ❌ 需要两个服务
- ❌ 可能产生额外费用

**适用场景：**
- 需要 PyMuPDF 的完整功能
- 复杂 PDF 文件处理

---

## 🚀 方案 A：纯 JavaScript 实现

### 第一步：安装 JavaScript 依赖

```bash
pnpm add pdf-parse xlsx
pnpm add -D @types/pdf-parse
```

### 第二步：修改 API 路由

使用 `src/app/api/parse-pdf-vercel/route.ts` 替代原有的 Python 版本。

### 第三步：配置 Vercel

项目已包含 `vercel.json` 配置文件，无需修改。

### 第四步：部署到 Vercel

#### 方式一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

#### 方式二：通过 Vercel Dashboard

1. 访问 [vercel.com](https://vercel.com)
2. 登录并点击 **Add New Project**
3. 导入你的 GitHub 仓库
4. 配置项目：
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
5. 点击 **Deploy**
6. 等待部署完成

### 第五步：配置环境变量

在 Vercel Dashboard 中添加环境变量（如果需要）：

```
NEXT_PUBLIC_APP_NAME=PDF Field Extractor
LLM_API_KEY=your_api_key  # 如果需要
```

### 第六步：测试部署

1. 打开部署后的 URL
2. 上传 PDF 文件测试
3. 检查字段提取功能

---

## 🚀 方案 B：Python 后端分离部署

### 架构说明

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │  Python Backend │
│   (Next.js)     │◄────────►│   (Render/Fly)  │
│                 │  API     │                 │
│  - 前端界面     │──────────►│  - PDF 解析     │
│  - 字段展示     │  PDF     │  - 字段提取     │
│  - Excel 下载   │          │  - Excel 生成   │
└─────────────────┘         └─────────────────┘
```

### 第一步：部署 Next.js 前端到 Vercel

参考方案 A 的步骤，部署前端到 Vercel。

### 第二步：部署 Python 后端

#### 选项 1：Render

1. 访问 [render.com](https://render.com)
2. 创建新的 Web Service
3. 选择 Python
4. 连接 GitHub 仓库（创建 Python 后端仓库）
5. 配置：
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app` 或 `python app.py`
   - **Environment Variables**:
     - `PYTHON_VERSION=3.12`
     - `PORT=8000`
6. 点击 **Create Web Service**
7. 等待部署完成，获得后端 URL

#### 选项 2：Railway

1. 访问 [railway.app](https://railway.app)
2. 创建新项目
3. 选择 Python 模板
4. 连接 GitHub 仓库
5. 配置环境变量
6. 部署

#### 选项 3：Fly.io

```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
flyctl auth login

# 初始化项目
flyctl launch

# 部署
flyctl deploy
```

### 第三步：修改前端 API 调用

在 Vercel 部署的前端中，修改 API 调用地址：

```typescript
// src/app/page.tsx

// 添加环境变量
const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';

// 修改 API 调用
const response = await fetch(`${PYTHON_BACKEND_URL}/api/parse-pdf`, {
  method: 'POST',
  body: formData,
});
```

### 第四步：配置 Vercel 环境变量

在 Vercel Dashboard 中添加：

```
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://your-python-backend.com
```

### 第五步：CORS 配置

在 Python 后端中配置 CORS：

```python
# app.py
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://your-vercel-app.vercel.app'])

@app.route('/api/parse-pdf', methods=['POST'])
def parse_pdf():
    # 处理逻辑
    pass
```

---

## 📋 方案对比

| 特性 | 方案 A (纯 JS) | 方案 B (分离部署) |
|------|--------------|------------------|
| 部署难度 | ⭐ 简单 | ⭐⭐⭐ 中等 |
| 费用 | ⭐ 免费 | ⭐⭐ 可能收费 |
| PDF 解析 | ⭐⭐ 基础 | ⭐⭐⭐⭐ 完整 |
| Excel 功能 | ⭐⭐⭐ 完整 | ⭐⭐⭐⭐ 完整 |
| 维护成本 | ⭐ 低 | ⭐⭐⭐ 高 |
| 推荐度 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🛠️ JavaScript PDF 解析库

### 安装依赖

```bash
pnpm add pdf-parse xlsx
```

### 使用示例

```typescript
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';

// PDF 解析
async function parsePDF(fileBuffer: Buffer): Promise<string> {
  const data = await pdf(fileBuffer);
  return data.text;
}

// Excel 生成
function createExcel(data: any[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
```

---

## 🔧 Vercel 配置说明

### vercel.json

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

**配置说明：**
- `buildCommand`: 构建命令
- `outputDirectory`: 输出目录
- `installCommand`: 安装依赖命令
- `framework`: 框架类型
- `regions`: 部署区域（hkg1 = 香港）

### 环境变量

在 Vercel Dashboard → Settings → Environment Variables 中配置：

```
NEXT_PUBLIC_APP_NAME=PDF Field Extractor
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://your-backend.com  # 方案 B 需要
```

---

## 📊 Vercel 免费额度

- **带宽**: 100 GB/月
- **构建时间**: 6,000 分钟/月
- **Serverless Function**: 100 GB/小时
- **存储**: 不适用（文件处理需要临时存储）

**注意：** 处理大文件时可能超出免费额度，建议限制文件大小。

---

## 🎯 推荐配置

### 限制文件大小

在 API 路由中添加文件大小限制：

```typescript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // 限制 5MB
    },
  },
};
```

### 添加错误处理

```typescript
try {
  // 处理逻辑
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: '处理失败' },
    { status: 500 }
  );
}
```

---

## 🐛 常见问题

### 问题 1: 部署失败

**可能原因：**
- 依赖安装失败
- 构建超时

**解决方案：**
- 检查 `package.json` 依赖
- 增加 Vercel 构建超时时间

### 问题 2: API 超时

**可能原因：**
- 文件太大
- LLM 响应慢

**解决方案：**
- 限制文件大小
- 使用流式响应

### 问题 3: CORS 错误（方案 B）

**解决方案：**
在 Python 后端配置 CORS，允许 Vercel 域名。

---

## 📚 参考资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [pdf-parse 文档](https://github.com/mozilla/pdf.js)
- [xlsx 文档](https://sheetjs.com/)

---

## 🎉 部署成功！

部署完成后：

1. 获得部署 URL：`https://your-app.vercel.app`
2. 访问应用
3. 测试 PDF 上传和字段提取功能
4. 配置自定义域名（可选）

---

**文档版本**: v1.0
**更新日期**: 2025-03-02
**适用平台**: Vercel
