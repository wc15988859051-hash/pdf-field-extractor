# 生产环境部署注意事项

## ⚠️ 重要：Python 脚本路径问题（已修复）

### 问题说明
在部署到 Vercel 或其他平台时，可能会遇到 Python 脚本找不到的问题，因为：
1. 开发环境的工作目录可能是 `/workspace/projects`
2. 部署环境的工作目录可能是 `/opt/bytefaas` 或其他路径
3. `src/` 目录下的文件在构建时可能会被处理

### 解决方案 ✅

**当前方案：使用 `public/` 目录存储 Python 脚本**

将 Python 脚本和模板文件放在 `public/scripts/` 目录下：
```
public/
└── scripts/
    ├── parse_pdf.py
    ├── export_to_excel.py
    └── assets/
        └── template.xlsx
```

**优点**：
- Next.js 会自动复制 `public/` 目录中的文件到构建输出
- 无论部署环境的工作目录是什么，都能正确访问
- 文件在构建后保持原路径结构

**代码实现**：
```typescript
const PROJECT_ROOT = process.cwd();
const PARSE_PYTHON_SCRIPT = join(PROJECT_ROOT, 'public/scripts/parse_pdf.py');
const EXPORT_PYTHON_SCRIPT = join(PROJECT_ROOT, 'public/scripts/export_to_excel.py');
const EXCEL_TEMPLATE_PATH = join(PROJECT_ROOT, 'public/scripts/assets/template.xlsx');
```

### 文件结构说明

当前项目结构：
```
workspace/projects/
├── public/
│   └── scripts/              ← Python 脚本（部署时可访问）
│       ├── parse_pdf.py
│       ├── export_to_excel.py
│       └── assets/
│           └── template.xlsx
├── src/
│   └── app/
│       └── api/
│           └── parse-pdf/
│               ├── route.ts
│               ├── scripts/   ← 备份副本（开发时使用）
│               └── assets/    ← 备份副本（开发时使用）
└── ...
```

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

### 前置环境
- [ ] Python 3.12 已安装
- [ ] PyMuPDF==1.23.26 已安装
- [ ] openpyxl==3.1.5 已安装
- [ ] Node.js 18+ 已安装
- [ ] pnpm 已安装

### 文件结构
- [ ] `public/scripts/parse_pdf.py` 存在
- [ ] `public/scripts/export_to_excel.py` 存在
- [ ] `public/scripts/assets/template.xlsx` 存在
- [ ] Python 脚本有执行权限（`chmod +x`）

### 运行环境
- [ ] Python 脚本路径正确（使用 `process.cwd()` 动态获取）
- [ ] 模板文件存在
- [ ] /tmp 目录可写
- [ ] /tmp/pdfs 目录可创建
- [ ] /tmp/extracted 目录可创建

### 服务器配置
- [ ] 防火墙配置正确
- [ ] Nginx 配置正确
- [ ] SSL 证书已配置
- [ ] PM2 已配置

### 部署后验证
- [ ] 测试上传 PDF 文件
- [ ] 验证字段提取功能
- [ ] 验证 Excel 导出功能
- [ ] 检查日志无错误

## 紧急修复方案

如果部署后发现 Python 脚本路径错误，可以：

1. **快速修复 - 使用环境变量**
```typescript
const PARSE_PYTHON_SCRIPT = process.env.PARSE_PYTHON_SCRIPT || '/path/to/script.py';
```

2. **检查实际工作目录**
```bash
# 在部署环境中执行
echo $PWD
node -e "console.log(process.cwd())"
```

3. **验证脚本位置**
```bash
# 查找 Python 脚本
find $(process.cwd) -name "parse_pdf.py"

# 检查 public 目录
ls -la $(process.cwd)/public/scripts/
```

4. **手动调整路径**
```bash
# 如果脚本不在预期位置，复制到 public/scripts
mkdir -p /path/to/project/public/scripts
cp /path/to/original/scripts/*.py /path/to/project/public/scripts/
cp /path/to/original/assets/*.xlsx /path/to/project/public/scripts/assets/

# 添加执行权限
chmod +x /path/to/project/public/scripts/*.py
```

5. **使用符号链接（临时方案）**
```bash
ln -s /actual/path/to/scripts /path/to/project/public/scripts
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
