# 🚀 Vercel 部署快速指南

## 📌 重要说明

**当前项目使用了 Python 脚本，需要先迁移到 Node.js 才能在 Vercel 上部署。**

详细迁移步骤请查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)。

---

## 方案选择

### ⭐ 推荐：迁移到 Node.js（纯 JavaScript 方案）

**优点**：
- ✅ Vercel 完美支持
- ✅ 冷启动速度快
- ✅ 统一技术栈，易维护
- ✅ 无需额外配置

**需要做的**：
1. 安装 `pdf-parse` 和 `exceljs` 替代 Python 脚本
2. 重写 PDF 解析和 Excel 导出逻辑（见 `VERCEL_DEPLOYMENT.md`）
3. 部署到 Vercel

**预计时间**：1-2 小时

### ⚠️ 备选：保留 Python（混合方案）

**优点**：
- ✅ 无需重写代码
- ✅ 保留现有逻辑

**缺点**：
- ❌ Vercel Python 支持有限
- ❌ 配置复杂
- ❌ 冷启动慢
- ❌ 可能产生额外费用

**预计时间**：2-4 小时 + 调试

---

## 快速部署步骤（Node.js 方案）

### 1. 安装依赖

```bash
pnpm add pdf-parse exceljs
```

### 2. 创建 Node.js 工具函数

创建 `src/lib/pdf-parser.ts`：

```typescript
import pdf from 'pdf-parse';

export async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}
```

创建 `src/lib/excel-exporter.ts`：

```typescript
import ExcelJS from 'exceljs';

const GLOBAL_EXCEL_PATH = '/tmp/extracted/all_data.xlsx';

export async function exportToExcel(data: any[], pdfFilename: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet;

  // 读取现有文件或创建新文件
  if (require('fs').existsSync(GLOBAL_EXCEL_PATH)) {
    await workbook.xlsx.readFile(GLOBAL_EXCEL_PATH);
    worksheet = workbook.getWorksheet(1);
  } else {
    worksheet = workbook.addWorksheet('Extracted Data');
    worksheet.addRow([
      'Article', 'PO#', 'Style Code#', 'Color Code#',
      'Product Name', 'Colour Name', 'Collection', 'Design Number',
      'Ex Port Date', 'Quantity', 'Unit Price', 'Amount',
      '原PDF名称'
    ]);
  }

  // 添加数据
  for (const item of data) {
    worksheet.addRow([
      item.Article || '',
      item['Order Reference'] ? `PO#${item['Order Reference']}` : '',
      // ... 其他字段
      pdfFilename || ''
    ]);
  }

  await workbook.xlsx.writeFile(GLOBAL_EXCEL_PATH);
  return GLOBAL_EXCEL_PATH;
}
```

### 3. 更新 API 路由

更新 `src/app/api/parse-pdf/route.ts`，将 Python 调用替换为 Node.js 函数：

```typescript
import { parsePDF } from '@/lib/pdf-parser';
import { exportToExcel } from '@/lib/excel-exporter';

// 在 POST 函数中：
const pdfText = await parsePDF(buffer); // 替换 Python 调用
await exportToExcel([extractedFields], file.name); // 替换 Python 调用
```

### 4. 配置环境变量

在 Vercel 项目设置中添加：

```
COZE_API_KEY=your_api_key_here
COZE_BASE_URL=https://api.coze.com
COZE_BOT_ID=your_bot_id_here
```

### 5. 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

---

## 📖 详细文档

- [完整部署指南](./VERCEL_DEPLOYMENT.md) - 包含两种方案的详细步骤
- [环境变量配置](./.env.example) - 环境变量示例
- [项目 README](./README.md) - 项目概述和开发指南

---

## ❓ 需要帮助？

如果你选择 Node.js 迁移方案，我可以帮你完成代码迁移。

告诉我你选择的方案，我会提供具体的实施步骤。
