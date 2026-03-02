# 🚀 PDF 字段提取应用 - 部署问题修复

## ⚠️ 部署环境路径问题已修复

### 问题描述
在部署到 coze.site 或其他平台时，遇到以下错误：
```
错误: PDF 解析失败: Command failed: python3 "/opt/bytefaas/src/app/api/parse-pdf/scripts/parse_pdf.py" "/tmp/pdfs/xxx.pdf"
```

**根本原因**：部署环境的工作目录与开发环境不同，导致 Python 脚本路径不正确。

### ✅ 解决方案

**将 Python 脚本和模板文件移动到 `public/` 目录**

Next.js 会自动复制 `public/` 目录中的文件到构建输出，确保在任何部署环境中都能正确访问。

### 📁 当前文件结构

```
workspace/projects/
├── public/                          ← 部署时可访问
│   └── scripts/
│       ├── parse_pdf.py
│       ├── export_to_excel.py
│       └── assets/
│           └── template.xlsx
├── src/
│   └── app/
│       └── api/
│           └── parse-pdf/
│               └── route.ts        ← 使用 public/scripts 中的脚本
├── scripts/
│   └── setup-deploy.sh             ← 部署配置脚本
├── DEPLOYMENT.md                   ← 完整部署指南
└── DEPLOYMENT_NOTES.md             ← 部署注意事项
```

### 🛠️ 快速部署步骤

#### 1. 运行部署配置脚本
```bash
# 在项目根目录执行
./scripts/setup-deploy.sh
```

这个脚本会：
- ✅ 检查项目结构
- ✅ 将 Python 脚本复制到 `public/scripts/` 目录
- ✅ 将模板文件复制到 `public/scripts/assets/` 目录
- ✅ 添加执行权限
- ✅ 验证文件完整性

#### 2. 安装 Python 依赖
```bash
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5
```

#### 3. 本地测试
```bash
# 构建项目
pnpm run build

# 启动生产环境
pnpm run start

# 测试 API
curl -X POST -F "file=@test.pdf" http://localhost:3000/api/parse-pdf
```

#### 4. 部署到生产环境

**方式 A: 云服务器部署（推荐）**
```bash
# 上传代码到服务器
scp -r . root@your-server:/var/www/pdf-extractor/

# 在服务器上
cd /var/www/pdf-extractor
./scripts/setup-deploy.sh
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5
pnpm install
pnpm run build
pm2 start pnpm --name "pdf-extractor" -- run start
```

**方式 B: Vercel 部署**
⚠️ **注意**: Vercel 免费版不支持 Python 运行时。如果需要在 Vercel 上部署，需要使用付费版或采用混合架构。

详细部署指南请参考：[DEPLOYMENT.md](./DEPLOYMENT.md)

### 🔍 故障排查

#### 问题 1: Python 脚本找不到
**错误**: `No such file or directory: '/xxx/public/scripts/parse_pdf.py'`

**解决方案**:
```bash
# 运行配置脚本
./scripts/setup-deploy.sh

# 验证文件存在
ls -la public/scripts/
```

#### 问题 2: Python 依赖缺失
**错误**: `ModuleNotFoundError: No module named 'fitz'`

**解决方案**:
```bash
pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5
```

#### 问题 3: 权限不足
**错误**: `Permission denied: 'public/scripts/parse_pdf.py'`

**解决方案**:
```bash
chmod +x public/scripts/*.py
```

### 📚 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整的部署指南
- [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md) - 部署注意事项和常见问题

### ✨ 关键改进

1. **动态路径解析**: 使用 `process.cwd()` 和 `path.join()` 动态获取路径
2. **public 目录存储**: Python 脚本和模板文件存储在 `public/` 目录，确保部署时可访问
3. **配置脚本**: 提供自动化配置脚本，简化部署流程
4. **调试日志**: 添加路径检查日志，方便排查问题
5. **详细文档**: 完整的部署指南和故障排查文档

### 🎯 部署检查清单

- [ ] 运行 `./scripts/setup-deploy.sh` 配置脚本
- [ ] 验证 `public/scripts/` 目录包含所有必需文件
- [ ] 安装 Python 依赖
- [ ] 本地构建测试通过
- [ ] 部署到生产环境
- [ ] 验证 API 功能正常
- [ ] 检查日志无错误

---

**最后更新**: 2026-03-02
**状态**: ✅ 已修复部署路径问题
