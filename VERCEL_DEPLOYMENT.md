# Vercel 部署指南

## 📋 目录

- [项目概述](#项目概述)
- [部署方案选择](#部署方案选择)
- [推荐方案：将 Python 迁移到 Node.js](#推荐方案将-python-迁移到-nodejs)
- [备选方案：使用 Vercel Python Runtime](#备选方案使用-vercel-python-runtime)
- [环境变量配置](#环境变量配置)
- [部署步骤](#部署步骤)
- [常见问题](#常见问题)

---

## 项目概述

### 技术栈
- **前端框架**: Next.js 16 (App Router)
- **UI 框架**: React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **UI 组件**: shadcn/ui
- **PDF 解析**: Python (PyMuPDF)
- **Excel 导出**: Python (openpyxl)
- **LLM**: doubao-seed-1-8-251228 (通过 coze-coding-dev-sdk)

### 项目结构
```
workspace/projects/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse-pdf/route.ts      # PDF 解析 API
│   │   │   └── export-excel/route.ts   # Excel 导出 API
│   │   └── page.tsx                    # 主页面
│   └── components/ui/
├── projects/
│   ├── pdf-field-extractor/
│   │   ├── scripts/
│   │   │   ├── parse_pdf.py            # Python PDF 解析
│   │   │   └── export_to_excel.py      # Python Excel 导出
│   │   └── assets/
│   │       └── template.xlsx
│   └── requirements.txt
└── requirements.txt                    # Python 依赖
```

---

## 部署方案选择

由于项目使用了 Python 脚本进行 PDF 解析和 Excel 导出，Vercel 部署有以下两个方案：

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案 A：迁移到 Node.js** | • 完全利用 Vercel Next.js 优势<br>• 更快的部署和冷启动<br>• 统一的 JavaScript/TypeScript 技术栈<br>• 更好的错误处理和调试 | • 需要重写 PDF 解析和 Excel 导出逻辑<br>• 需要安装额外的 npm 包 | ⭐⭐⭐⭐⭐ |
| **方案 B：使用 Python Runtime** | • 保留现有 Python 代码<br>• 无需重写逻辑 | • Vercel Python 支持有限<br>• 需要将 API 重写为 Python 函数<br>• 跨语言调用复杂<br>• 冷启动较慢 | ⭐⭐ |

---

## 推荐方案：将 Python 迁移到 Node.js

### 方案概述
使用纯 Node.js 库替代 Python 脚本：
- **PDF 解析**: `pdf-parse` 或 `pdfjs-dist`
- **Excel 导出**: `exceljs` 或 `xlsx`

### 步骤 1：安装 Node.js 依赖

```bash
pnpm add pdf-parse exceljs
```

### 步骤 2：创建 Node.js PDF 解析函数

创建 `src/lib/pdf-parser.ts`:

```typescript
import pdf from 'pdf-parse';

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### 步骤 3：创建 Node.js Excel 导出函数

创建 `src/lib/excel-exporter.ts`:

```typescript
import ExcelJS from 'exceljs';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, copyFile } from 'fs/promises';

const GLOBAL_EXCEL_PATH = '/tmp/extracted/all_data.xlsx';

export async function exportToExcel(data: any[], pdfFilename: string): Promise<string> {
  const excelDir = '/tmp/extracted';

  // 确保目录存在
  if (!existsSync(excelDir)) {
    await mkdir(excelDir, { recursive: true });
  }

  // 如果文件已存在，读取并追加；否则创建新文件
  const workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet;

  if (existsSync(GLOBAL_EXCEL_PATH)) {
    await workbook.xlsx.readFile(GLOBAL_EXCEL_PATH);
    worksheet = workbook.getWorksheet(1);
  } else {
    // 复制模板
    const templatePath = '/workspace/projects/projects/pdf-field-extractor/assets/template.xlsx';
    if (existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      worksheet = workbook.getWorksheet(1);
    } else {
      // 创建新工作表
      worksheet = workbook.addWorksheet('Extracted Data');
      worksheet.addRow([
        'Article', 'PO#', 'Style Code#', 'Color Code#',
        'Product Name', 'Colour Name', 'Collection', 'Design Number',
        'Ex Port Date', 'Quantity', 'Unit Price', 'Amount',
        '原PDF名称'
      ]);
    }
  }

  // 添加数据行
  for (const item of data) {
    worksheet.addRow([
      item.Article || '',
      item['Order Reference'] ? `PO#${item['Order Reference']}` : '',
      item['Collection'] ? `style code#${item['Collection']}` : '',
      item['Colour Name'] ? `color code#${item['Colour Name']}` : '',
      item['Product Name'] || '',
      item['Colour Name'] || '',
      item['Collection'] || '',
      item['Design Number'] || '',
      item['Ex Port Date'] || '',
      item.Total || '',
      item['GBP Retail Price'] ? `GBP ${item['GBP Retail Price']}` : '',
      item['Line Value'] ? `$${formatCurrency(item['Line Value'])}` : '',
      pdfFilename || ''
    ]);
  }

  // 保存文件
  await workbook.xlsx.writeFile(GLOBAL_EXCEL_PATH);
  return GLOBAL_EXCEL_PATH;
}

function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(numValue)) return '0.00';
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
```

### 步骤 4：更新 API 路由

更新 `src/app/api/parse-pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parsePDF } from '@/lib/pdf-parser';
import { exportToExcel } from '@/lib/excel-exporter';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// ... 其他代码保持不变 ...

// 在 POST 函数中使用 Node.js 版本的 PDF 解析
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持 PDF 文件' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 读取文件为 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 步骤 1: 解析 PDF（使用 Node.js 版本）
    const pdfText = await parsePDF(buffer);

    // 步骤 2: 提取字段（使用 LLM）
    const extractedFields = await extractFieldsWithLLM(pdfText);

    // 步骤 3: 导出 Excel（使用 Node.js 版本）
    await exportToExcel([extractedFields], file.name);

    return NextResponse.json({
      success: true,
      filename: file.name,
      fields: extractedFields,
      message: 'PDF 解析成功，字段已提取并追加到全局 Excel 文件'
    });

  } catch (error) {
    console.error('PDF 解析错误:', error);
    return NextResponse.json(
      { error: 'PDF 解析失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
```

### 步骤 5：更新 `package.json`

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "exceljs": "^4.4.0",
    "coze-coding-dev-sdk": "latest",
    "lucide-react": "latest",
    "next": "16",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

---

## 备选方案：使用 Vercel Python Runtime

如果你希望保留 Python 代码，可以使用 Vercel 的 Python Runtime。

### 步骤 1：创建 Python API 函数

创建 `api/parse-pdf.py`:

```python
import os
import json
import tempfile
from http.server import BaseHTTPRequestHandler
from pdf_field_extractor.scripts.parse_pdf import parse_pdf
from pdf_field_extractor.scripts.export_to_excel import export_to_excel

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 解析 multipart/form-data
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        # 保存 PDF 文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            f.write(post_data)
            pdf_path = f.name

        try:
            # 解析 PDF
            pdf_text = parse_pdf(pdf_path)

            # 使用 LLM 提取字段
            # 这里需要调用 coze-coding-dev-sdk 的 Python 版本
            # 由于当前使用的是 TypeScript SDK，这部分需要额外处理

            # 导出 Excel
            export_to_excel(extracted_fields, 'temp.pdf')

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'data': extracted_fields
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())

        finally:
            # 清理临时文件
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
```

### 步骤 2：配置 `vercel.json`

```json
{
  "builds": [
    {
      "src": "api/**/*.py",
      "use": "@vercel/python"
    },
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

### 步骤 3：调整 Python 依赖路径

将 Python 脚本放在根目录的 `api/` 文件夹下，确保 Vercel 能够找到它们。

---

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `COZE_API_KEY` | Coze API 密钥 | 从 Coze 平台获取 |
| `COZE_BASE_URL` | Coze API 基础 URL | `https://api.coze.com` |
| `COZE_BOT_ID` | Bot ID | 从 Coze 平台获取 |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `MAX_FILE_SIZE` | 最大文件大小（MB） | `10` |

---

## 部署步骤

### 方法 1：通过 Vercel CLI 部署（推荐）

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署项目

```bash
cd /workspace/projects
vercel
```

按照提示操作：
- ? Set up and deploy "~/workspace/projects"? [Y/n] → Y
- ? Which scope do you want to deploy to? → 选择你的账号
- ? Link to existing project? [y/N] → N（首次部署）
- ? What's your project's name? → `pdf-field-extractor`
- ? In which directory is your code located? → `./`
- ? Want to override the settings? [y/N] → y（如需修改配置）

#### 4. 配置环境变量

在 Vercel 控制台中添加环境变量：
1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加上述必需的环境变量

#### 5. 重新部署

```bash
vercel --prod
```

### 方法 2：通过 GitHub 集成部署

#### 1. 将代码推送到 GitHub

```bash
cd /workspace/projects
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pdf-field-extractor.git
git push -u origin main
```

#### 2. 在 Vercel 中导入项目

1. 登录 [vercel.com](https://vercel.com)
2. 点击 "Add New Project"
3. 选择 GitHub 仓库
4. 选择 `pdf-field-extractor` 项目
5. 配置项目设置：
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `.next`
6. 添加环境变量
7. 点击 "Deploy"

---

## 常见问题

### Q1: Vercel 上无法调用 Python 脚本怎么办？

**A**: 使用方案 A（迁移到 Node.js）是最佳解决方案。Node.js 在 Vercel 上有更好的支持，部署和运行更快。

### Q2: 如何处理大文件上传？

**A**: Vercel 默认限制请求体大小为 4.5MB。如需处理更大的文件：

1. 使用 Vercel Blob 存储上传大文件
2. 或配置 `vercel.json` 增加限制（付费计划）：

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Q3: LLM 调用失败怎么办？

**A**: 确保：
1. 环境变量配置正确
2. Coze API 密钥有效
3. 网络连接正常（Vercel 有网络限制）

### Q4: Excel 文件存储在哪里？

**A**: Vercel Serverless Functions 是无状态的，`/tmp` 目录在函数执行后会被清除。解决方案：

1. **推荐**: 使用 Vercel Blob 存储保存生成的 Excel 文件
2. **备选**: 直接返回文件流，让用户下载

### Q5: 如何在 Vercel 上持久化 Excel 文件？

**A**: 使用 Vercel Blob Storage：

```bash
pnpm add @vercel/blob
```

```typescript
import { put } from '@vercel/blob';

// 保存 Excel 到 Blob
const blob = await put('all_data.xlsx', fileBuffer, {
  access: 'public',
});

// 返回下载 URL
return blob.url;
```

---

## 部署后检查清单

- [ ] 网站可以正常访问
- [ ] PDF 上传功能正常
- [ ] 字段提取准确
- [ ] Excel 下载功能正常
- [ ] 历史记录功能正常
- [ ] 环境变量配置正确
- [ ] 错误日志正常记录

---

## 推荐方案总结

**强烈推荐使用方案 A（迁移到 Node.js）**，因为：

1. ✅ **性能更好**: Node.js 在 Vercel 上的冷启动速度更快
2. ✅ **维护简单**: 统一的技术栈，减少跨语言复杂性
3. ✅ **调试方便**: 可以在浏览器中直接调试 API
4. ✅ **成本更低**: 避免使用 Python Runtime 的额外费用
5. ✅ **扩展性强**: 未来更容易添加新功能

如果你选择方案 A，我可以帮你完成代码迁移。
