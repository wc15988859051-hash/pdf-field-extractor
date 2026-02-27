#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "=== 开始构建项目 ==="
echo "工作目录: ${COZE_WORKSPACE_PATH}"

echo ""
echo "[1/3] 安装 Node.js 依赖..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo ""
echo "[2/3] 安装 Python 依赖..."
if command -v pip3 &> /dev/null; then
  echo "检测到 pip3，正在安装 Python 依赖..."
  pip3 install -r requirements.txt --no-cache-dir
  echo "Python 依赖安装完成"
else
  echo "警告: 未检测到 pip3，跳过 Python 依赖安装"
  echo "请手动安装: pip3 install -r requirements.txt"
fi

echo ""
echo "[3/3] 构建 Next.js 项目..."
npx next build

echo ""
echo "=== 构建完成 ==="
echo "项目构建成功！"
