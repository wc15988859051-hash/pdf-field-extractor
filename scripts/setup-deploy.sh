#!/bin/bash
# 部署环境配置脚本
# 用于在部署后确保 Python 脚本位于正确位置

set -e

PROJECT_ROOT="${1:-$(pwd)}"
SCRIPTS_DIR="$PROJECT_ROOT/public/scripts"
ASSETS_DIR="$SCRIPTS_DIR/assets"

echo "📦 配置部署环境..."
echo "项目根目录: $PROJECT_ROOT"
echo ""

# 检查是否在正确的目录
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo "❌ 错误: 未找到 package.json，请确认在项目根目录执行此脚本"
    echo "用法: ./scripts/setup-deploy.sh [项目路径]"
    exit 1
fi

# 创建目录
echo "📁 创建必要的目录..."
mkdir -p "$ASSETS_DIR"

# 检查并复制 Python 脚本
if [ -f "$PROJECT_ROOT/src/app/api/parse-pdf/scripts/parse_pdf.py" ]; then
    echo "✅ 找到 parse_pdf.py，复制到 public/scripts/"
    cp "$PROJECT_ROOT/src/app/api/parse-pdf/scripts/parse_pdf.py" "$SCRIPTS_DIR/"
else
    echo "⚠️  警告: 未找到 parse_pdf.py"
fi

if [ -f "$PROJECT_ROOT/src/app/api/parse-pdf/scripts/export_to_excel.py" ]; then
    echo "✅ 找到 export_to_excel.py，复制到 public/scripts/"
    cp "$PROJECT_ROOT/src/app/api/parse-pdf/scripts/export_to_excel.py" "$SCRIPTS_DIR/"
else
    echo "⚠️  警告: 未找到 export_to_excel.py"
fi

# 检查并复制模板文件
if [ -f "$PROJECT_ROOT/src/app/api/parse-pdf/assets/template.xlsx" ]; then
    echo "✅ 找到 template.xlsx，复制到 public/scripts/assets/"
    cp "$PROJECT_ROOT/src/app/api/parse-pdf/assets/template.xlsx" "$ASSETS_DIR/"
else
    echo "⚠️  警告: 未找到 template.xlsx"
fi

# 添加执行权限
echo "🔐 添加执行权限..."
chmod +x "$SCRIPTS_DIR"/*.py 2>/dev/null || true

# 验证文件
echo ""
echo "📋 验证文件结构..."
FILES=(
    "$SCRIPTS_DIR/parse_pdf.py"
    "$SCRIPTS_DIR/export_to_excel.py"
    "$ASSETS_DIR/template.xlsx"
)

ALL_OK=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        ALL_OK=false
    fi
done

echo ""
if [ "$ALL_OK" = true ]; then
    echo "✅ 部署环境配置完成！"
    echo ""
    echo "下一步:"
    echo "1. 确保已安装 Python 依赖: pip3 install PyMuPDF==1.23.26 openpyxl==3.1.5"
    echo "2. 构建项目: pnpm run build"
    echo "3. 启动服务: pnpm run start"
    exit 0
else
    echo "❌ 部署环境配置失败，请检查缺失的文件"
    exit 1
fi
