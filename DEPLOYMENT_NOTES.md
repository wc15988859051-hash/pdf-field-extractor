# 生产环境部署注意事项

## ⚠️ 重要：Python 脚本路径问题

### 问题说明
在部署到 Vercel 或其他平台时，可能会遇到 Python 脚本找不到的问题，因为：
1. 开发环境的路径是 `/workspace/projects/src/app/api/parse-pdf/scripts/`
2. 部署环境的路径可能不同
3. Next.js 在构建时会重排文件结构

### 解决方案

#### 方案 1: 使用相对路径（推荐）✅

在 `src/app/api/parse-pdf/route.ts` 中，使用 `process.cwd()` 获取工作目录：

```typescript
// 获取项目根目录
const PROJECT_ROOT = process.cwd();

// 使用相对路径
const PARSE_PYTHON_SCRIPT = path.join(PROJECT_ROOT, 'src/app/api/parse-pdf/scripts/parse_pdf.py');
const EXPORT_PYTHON_SCRIPT = path.join(PROJECT_ROOT, 'src/app/api/parse-pdf/scripts/export_to_excel.py');
const EXCEL_TEMPLATE_PATH = path.join(PROJECT_ROOT, 'src/app/api/parse-pdf/assets/template.xlsx');
```

#### 方案 2: 使用静态文件服务

将 Python 脚本和模板文件放到 `public/` 目录：

```
public/
└── scripts/
    ├── parse_pdf.py
    ├── export_to_excel.py
    └── assets/
        └── template.xlsx
```

然后在代码中使用：
```typescript
const PARSE_PYTHON_SCRIPT = path.join(process.cwd(), 'public/scripts/parse_pdf.py');
```

#### 方案 3: 打包到 `.next` 目录（当前使用）

当前实现将脚本放在 `src/` 目录下，Next.js 会自动包含这些文件。

## 验证部署

### 1. 本地构建测试
```bash
# 构建生产版本
pnpm run build

# 检查构建输出
ls -la .next/server/app/api/parse-pdf/
```

### 2. 部署后测试
```bash
# 测试 API 端点
curl -X POST -F "file=@test.pdf" https://your-domain.com/api/parse-pdf

# 检查响应
# 应该返回: {"success": true, "filename": "...", "fields": {...}}
```

## 常见部署平台配置

### Vercel

#### 需要安装的依赖
在 `package.json` 中添加：
```json
{
  "scripts": {
    "vercel-build": "pnpm install && pnpm run build"
  }
}
```

#### Vercel 环境变量
Vercel 不支持运行 Python 脚本，因此需要使用：
- **Vercel Functions** (支持 Node.js)
- **Vercel Edge Functions** (支持 WebAssembly)

**注意**: Vercel 免费版不支持 Python 运行时。如果需要在 Vercel 上运行 Python 脚本，需要：
1. 使用付费版支持 Serverless Functions
2. 或者将 Python 脚本迁移到单独的服务

### Netlify

类似 Vercel，Netlify 也有限制。

### 云服务器（推荐）

**最可靠的部署方式是使用云服务器**，因为：
1. 完全控制 Python 环境
2. 可以安装任意依赖
3. 支持长时间运行的后台任务

## 推荐部署方案

### 方案 A: Vercel + 云服务器 API（混合架构）

```
前端（Vercel）→ API 请求 → 云服务器（Python 后端）
```

**优点**:
- 前端免费部署到 Vercel
- 后端灵活部署到云服务器
- 成本低

**缺点**:
- 需要管理两个服务
- 跨域配置

### 方案 B: 云服务器（一体化部署）⭐

**最推荐方案**，因为：
- 一个服务包含前后端
- 完全控制
- 无跨域问题
- 支持所有 Python 功能

## 部署检查清单

- [ ] Python 3.12 已安装
- [ ] PyMuPDF==1.23.26 已安装
- [ ] openpyxl==3.1.5 已安装
- [ ] Node.js 18+ 已安装
- [ ] pnpm 已安装
- [ ] Python 脚本路径正确
- [ ] 模板文件存在
- [ ] /tmp 目录可写
- [ ] 防火墙配置正确
- [ ] Nginx 配置正确
- [ ] SSL 证书已配置
- [ ] PM2 已配置

## 紧急修复方案

如果部署后发现 Python 脚本路径错误，可以：

1. **快速修复 - 使用环境变量**
```typescript
const PARSE_PYTHON_SCRIPT = process.env.PARSE_PYTHON_SCRIPT || '/path/to/script.py';
```

2. **手动调整路径**
```bash
# 查看实际文件位置
find / -name "parse_pdf.py"

# 更新代码中的路径
```

3. **使用符号链接**
```bash
ln -s /actual/path/to/scripts /workspace/projects/scripts
```

## 联系支持

如果遇到问题，请提供：
1. 错误日志
2. 部署平台
3. Node.js 版本
4. Python 版本
5. 完整的错误堆栈

---

**重要提醒**: 
- 不要在生产环境使用硬编码路径
- 始终使用 `process.cwd()` 或 `__dirname` 获取动态路径
- 在部署前进行充分的本地测试
