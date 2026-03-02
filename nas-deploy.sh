#!/bin/bash

# PDF 字段提取应用 - NAS 自动部署脚本
# 适用于 Ubuntu/Debian 系统

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 安装 Node.js
install_nodejs() {
    log_info "检查 Node.js..."
    if command_exists node; then
        local node_version=$(node -v)
        log_info "Node.js 已安装: $node_version"
        return
    fi

    log_info "安装 Node.js 24..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
    log_info "Node.js 安装完成: $(node -v)"
}

# 安装 Python 3.12
install_python() {
    log_info "检查 Python 3.12..."
    if command_exists python3.12; then
        log_info "Python 3.12 已安装: $(python3.12 --version)"
        return
    fi

    log_info "安装 Python 3.12..."
    apt-get update
    apt-get install -y software-properties-common
    add-apt-repository -y ppa:deadsnakes/ppa
    apt-get update
    apt-get install -y python3.12 python3.12-venv python3.12-dev
    log_info "Python 3.12 安装完成: $(python3.12 --version)"
}

# 安装 pnpm
install_pnpm() {
    log_info "检查 pnpm..."
    if command_exists pnpm; then
        log_info "pnpm 已安装: $(pnpm -v)"
        return
    fi

    log_info "安装 pnpm..."
    npm install -g pnpm
    log_info "pnpm 安装完成: $(pnpm -v)"
}

# 创建目录结构
create_directories() {
    log_info "创建项目目录结构..."
    mkdir -p /opt/pdf-extractor
    mkdir -p /tmp/pdfs
    mkdir -p /tmp/extracted
    mkdir -p /opt/pdf-extractor/logs
    log_info "目录创建完成"
}

# 安装依赖
install_dependencies() {
    cd /opt/pdf-extractor

    log_info "安装 Node.js 依赖..."
    if [ -f "package.json" ]; then
        pnpm install
        log_info "Node.js 依赖安装完成"
    else
        log_warn "未找到 package.json，跳过 Node.js 依赖安装"
    fi

    log_info "安装 Python 依赖..."
    if [ -f "requirements.txt" ]; then
        python3.12 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        deactivate
        log_info "Python 依赖安装完成"
    else
        log_warn "未找到 requirements.txt，手动安装 Python 依赖..."
        python3.12 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install PyMuPDF==1.23.26 openpyxl==3.1.5
        deactivate
        log_info "Python 依赖安装完成"
    fi
}

# 构建项目
build_project() {
    cd /opt/pdf-extractor

    log_info "构建 Next.js 项目..."
    if [ -f "package.json" ]; then
        pnpm run build
        log_info "项目构建完成"
    else
        log_warn "未找到 package.json，跳过构建"
    fi
}

# 创建 systemd 服务
create_systemd_service() {
    log_info "创建 systemd 服务..."

    cat > /etc/systemd/system/pdf-extractor.service << EOF
[Unit]
Description=PDF Field Extractor Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/pdf-extractor
Environment="NODE_ENV=production"
Environment="TZ=Asia/Shanghai"
ExecStart=$(which pnpm) run start
Restart=always
RestartSec=10
StandardOutput=append:/opt/pdf-extractor/logs/app.log
StandardError=append:/opt/pdf-extractor/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable pdf-extractor
    log_info "systemd 服务创建完成"
}

# 启动服务
start_service() {
    log_info "启动 PDF Extractor 服务..."
    systemctl start pdf-extractor
    sleep 3

    if systemctl is-active --quiet pdf-extractor; then
        log_info "服务启动成功！"
        log_info "服务状态: $(systemctl is-active pdf-extractor)"
    else
        log_error "服务启动失败，请检查日志"
        systemctl status pdf-extractor
        exit 1
    fi
}

# 显示部署信息
show_info() {
    local nas_ip=$(hostname -I | awk '{print $1}')
    echo ""
    echo "=========================================="
    log_info "部署完成！"
    echo "=========================================="
    echo ""
    echo "📱 访问地址:"
    echo "   本地访问: http://localhost:5000"
    echo "   局域网访问: http://${nas_ip}:5000"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看状态: sudo systemctl status pdf-extractor"
    echo "   启动服务: sudo systemctl start pdf-extractor"
    echo "   停止服务: sudo systemctl stop pdf-extractor"
    echo "   重启服务: sudo systemctl restart pdf-extractor"
    echo "   查看日志: sudo journalctl -u pdf-extractor -f"
    echo ""
    echo "📂 项目目录: /opt/pdf-extractor"
    echo "📁 临时文件: /tmp/pdfs"
    echo "📊 Excel 输出: /tmp/extracted"
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "  PDF 字段提取应用 - NAS 自动部署脚本"
    echo "=========================================="
    echo ""

    # 检查 root 权限
    check_root

    # 更新软件包列表
    log_info "更新软件包列表..."
    apt-get update

    # 检查系统架构
    local arch=$(uname -m)
    log_info "系统架构: $arch"

    if [ "$arch" != "x86_64" ]; then
        log_warn "警告: 当前系统架构为 $arch，可能存在兼容性问题"
    fi

    # 安装依赖
    install_nodejs
    install_python
    install_pnpm

    # 创建目录
    create_directories

    # 检查项目文件
    if [ ! -f "/opt/pdf-extractor/package.json" ]; then
        log_error "未找到项目文件！"
        log_warn "请先将项目文件上传到 /opt/pdf-extractor 目录"
        log_info "上传方法:"
        echo "   scp -r project-files/* user@nas-ip:/opt/pdf-extractor/"
        echo ""
        exit 1
    fi

    # 安装依赖
    install_dependencies

    # 构建项目
    build_project

    # 创建服务
    create_systemd_service

    # 启动服务
    start_service

    # 显示信息
    show_info
}

# 运行主函数
main
