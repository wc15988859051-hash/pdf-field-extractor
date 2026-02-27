# PDF 字段提取器 - 项目重构文档

## 项目概述

PDF 字段提取器是一个基于 Next.js 的 Web 应用，用于从 PDF 文件中提取业务字段并导出到 Excel 文件。

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **UI 组件**: React 19 + shadcn/ui
- **样式方案**: Tailwind CSS 4
- **语言**: TypeScript 5
- **后端处理**: Python 3.12
- **PDF 解析**: PyMuPDF 1.23.26
- **Excel 导出**: openpyxl 3.1.5
- **LLM 服务**: doubao-seed-1-8-251228
- **包管理器**: pnpm

## 项目结构

```
src/
├── app/                          # Next.js 应用目录
│   ├── api/                      # API 路由
│   │   ├── parse-pdf/           # PDF 解析 API
│   │   │   └── route.ts
│   │   └── export-excel/        # Excel 导出 API
│   │       └── route.ts
│   ├── page.tsx                 # 主页面
│   ├── globals.css              # 全局样式
│   └── layout.tsx               # 布局组件
│
├── lib/                         # 核心逻辑库
│   ├── config/                  # 配置文件
│   │   ├── constants.ts        # 常量配置（路径、字段前缀等）
│   │   └── field-mapping.ts    # 字段映射配置
│   │
│   ├── python/                  # Python 脚本
│   │   ├── pdf-parser.py       # PDF 解析脚本
│   │   └── excel-exporter.py   # Excel 导出脚本
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   └── index.ts            # 类型定义
│   │
│   └── utils/                   # 工具函数
│       ├── llm-helper.ts       # LLM 调用工具
│       ├── file-helper.ts      # 文件处理工具
│       └── python-helper.ts    # Python 脚本调用工具
│
└── components/                  # React 组件
    └── ui/                      # shadcn/ui 组件库

projects/                        # 原始项目文件（保留）
└── pdf-field-extractor/        # 原始 Skill 项目
    ├── scripts/                # Python 脚本（已废弃）
    ├── assets/                 # 资源文件
    └── SKILL.md               # Skill 文档
```

## 核心功能

### 1. PDF 解析
- 使用 PyMuPDF 解析 PDF 文件
- 提取文本内容和表格数据
- 保留文档结构信息

### 2. 字段提取
- 使用 LLM (doubao-seed-1-8-251228) 智能提取业务字段
- 支持字段变体识别
- 提取的字段包括：
  - Article（产品编号）
  - Order Reference（订单参考号）
  - Colour Name（颜色名称）
  - GBP Retail Price（英镑零售价）
  - Collection（系列/集合）
  - Design Number（设计编号）
  - Ex Port Date（出口日期）
  - Total（总额/数量）
  - Unit Price（单价）
  - Line Value（行金额）
  - Product Name（产品名称）

### 3. Excel 导出
- 支持多文件数据合并到同一个 Excel 文件
- 自动添加字段前缀（PO#、style code#、color code#、GBP）
- 金额字段格式化为美元格式（$X,XXX.XX）
- 自动合并单元格
- 支持增量更新（去重并追加新数据）

### 4. 前端功能
- 支持拖拽上传多个 PDF 文件
- 实时显示文件处理状态
- 展示提取的字段结果
- 历史记录功能（localStorage 存储）
- 全局 Excel 文件下载

## 配置说明

### 常量配置（`src/lib/config/constants.ts`）

包含以下常量：
- 文件路径常量（临时目录、脚本路径、模板路径）
- LLM 配置（模型、温度参数）
- 文件大小限制
- Excel 格式常量（列索引、行号）
- 字段值前缀规则
- 历史记录配置

### 字段映射配置（`src/lib/config/field-mapping.ts`）

定义：
- PDF 原始字段到 Excel 目标字段的映射关系
- 需要提取的字段列表
- 字段显示名称（用于前端展示）
- 需要添加前缀的字段
- 金额格式化字段

## API 路由

### POST `/api/parse-pdf`

接收 PDF 文件，解析并提取字段，导出到全局 Excel 文件。

**请求**:
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData 包含 file 字段

**响应**:
```json
{
  "success": true,
  "filename": "document.pdf",
  "fields": {
    "Article": "值",
    "Order Reference": "值",
    ...
  },
  "message": "PDF 解析成功，字段已提取并追加到全局 Excel 文件"
}
```

### GET `/api/export-excel`

下载全局 Excel 文件。

**请求**:
- Method: GET

**响应**:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="all_data.xlsx"

## 部署说明

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

### 生产构建

```bash
# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start
```

### Docker 部署

```bash
# 构建镜像
docker build -t pdf-extractor .

# 运行容器
docker run -p 5000:5000 -e OPENAI_API_KEY=your_key pdf-extractor
```

### 云平台部署

推荐使用以下平台：
- **Vercel**: Next.js 官方推荐（需要将 Python 逻辑改为 Node.js）
- **Railway**: 支持全栈应用
- **Render**: 类似 Railway
- **自建服务器**: 使用 Docker 容器化部署

## 环境变量

在部署前需要配置以下环境变量：

- `OPENAI_API_KEY`: LLM 服务 API 密钥

## 注意事项

1. **文件大小限制**: 默认限制为 10MB，可在 `constants.ts` 中修改
2. **历史记录**: 最多保留 50 条记录，可在 `constants.ts` 中修改
3. **Excel 文件位置**: 全局 Excel 文件存储在 `/tmp/extracted/all_data.xlsx`
4. **Python 依赖**: 确保安装了 PyMuPDF 和 openpyxl
5. **LLM 服务**: 确保配置了正确的 API 密钥

## 重构改进

### 代码结构优化
1. 将配置文件集中到 `src/lib/config/`
2. 将 Python 脚本移到 `src/lib/python/` 便于管理
3. 将工具函数拆分到 `src/lib/utils/`
4. 统一类型定义到 `src/lib/types/`

### 代码质量提升
1. 添加完整的 TypeScript 类型定义
2. 统一代码风格和命名规范
3. 添加详细的代码注释
4. 优化错误处理逻辑

### 可维护性增强
1. 配置集中管理，便于修改
2. 工具函数复用，减少重复代码
3. 清晰的目录结构，易于理解
4. 完善的文档说明

## 许可证

MIT License
