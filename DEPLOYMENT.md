# 生产环境部署指南

## Python 依赖安装方案

本应用需要以下 Python 依赖：
- PyMuPDF==1.23.26 (PDF 解析)
- openpyxl==3.1.5 (Excel 操作)

### 方案 1：自动安装（推荐）

构建脚本已配置为在构建时自动安装 Python 依赖。

**已配置的文件：**
- `requirements.txt` - Python 依赖列表
- `scripts/build.sh` - 构建时自动安装
- `scripts/prepare.sh` - 开发环境自动安装

**使用方法：**
```bash
# 构建时会自动安装 Python 依赖
pnpm build
# 或
coze build
```

**构建脚本会：**
1. 检测 pip3 是否可用
2. 如果可用，自动安装 requirements.txt 中的依赖
3. 如果不可用，显示警告信息

### 方案 2：手动安装

如果自动安装失败，可以手动安装：

```bash
# 在项目根目录执行
pip3 install -r requirements.txt
```

### 方案 3：使用 Docker（如果适用）

如果使用 Docker 部署，可以在 Dockerfile 中添加：

```dockerfile
FROM node:18

# 安装 Python 3 和 pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# 其他 Node.js 构建步骤...
```

### 方案 4：在运行时安装

如果构建环境没有 Python，可以在运行时安装：

修改 `scripts/start.sh`：
```bash
#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# 检查并安装 Python 依赖
if ! python3 -c "import fitz" 2>/dev/null || ! python3 -c "import openpyxl" 2>/dev/null; then
  echo "Python 依赖未安装，正在安装..."
  pip3 install -r requirements.txt --no-cache-dir
fi

# 启动服务
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    npx next start --port ${DEPLOY_RUN_PORT}
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
```

## 验证安装

安装完成后，可以验证依赖是否正确安装：

```bash
# 验证 PyMuPDF
python3 -c "import fitz; print(f'PyMuPDF version: {fitz.__version__}')"

# 验证 openpyxl
python3 -c "import openpyxl; print(f'openpyxl version: {openpyxl.__version__}')"

# 或一次性验证所有依赖
python3 << EOF
import sys
try:
    import fitz
    import openpyxl
    print('✓ 所有 Python 依赖已正确安装')
    print(f'  PyMuPDF: {fitz.__version__}')
    print(f'  openpyxl: {openpyxl.__version__}')
except ImportError as e:
    print(f'✗ 依赖缺失: {e}')
    sys.exit(1)
EOF
```

## 生产环境检查清单

部署到生产环境前，请检查：

- [ ] Python 3 已安装（推荐 3.8+）
- [ ] pip3 可用
- [ ] requirements.txt 文件存在
- [ ] 构建脚本已修改（包含 Python 依赖安装）
- [ ] 运行脚本已修改（可选，包含依赖检查）
- [ ] 测试 PDF 上传功能
- [ ] 检查服务器日志，确认无错误

## 常见问题

### Q1: pip3 未找到
**解决方案：**
```bash
# Ubuntu/Debian
apt-get update
apt-get install python3 python3-pip

# CentOS/RHEL
yum install python3 python3-pip

# Alpine Linux
apk add py3-pip
```

### Q2: 权限错误
**解决方案：**
```bash
# 使用用户级安装
pip3 install --user -r requirements.txt

# 或使用虚拟环境
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Q3: 网络问题导致安装失败
**解决方案：**
```bash
# 使用国内镜像
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 或使用阿里云镜像
pip3 install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt
```

### Q4: 生产环境没有 Python
**解决方案：**
1. 联系运维团队安装 Python 3 和 pip3
2. 或使用包含 Python 的 Docker 镜像
3. 或将 Python 脚本改用 Node.js 实现

## 日志检查

部署后，检查日志确认 Python 依赖已安装：

```bash
# 查看构建日志
tail -100 /app/work/logs/bypass/app.log | grep -i "python"

# 查看错误日志
tail -100 /app/work/logs/bypass/app.log | grep -i "error\|fail"

# 测试 PDF 解析
curl -X POST -F "file=@test.pdf" http://localhost:5000/api/parse-pdf
```

## 联系支持

如果遇到问题，请提供：
1. 系统信息（OS 版本）
2. Python 版本（`python3 --version`）
3. pip 版本（`pip3 --version`）
4. 错误日志
5. 构建日志
