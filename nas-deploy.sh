#!/bin/bash

# NAS 快速部署脚本
# 使用方法: sh nas-deploy.sh

set -e

echo "=========================================="
echo "PDF Field Extractor - NAS 部署脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
echo -e "${YELLOW}[1/6] 检查 Docker 环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 环境检查通过${NC}"
echo ""

# 检查必要文件是否存在
echo -e "${YELLOW}[2/6] 检查项目文件...${NC}"
REQUIRED_FILES=("Dockerfile" "docker-compose.yml" "package.json" "pnpm-lock.yaml")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}错误: 缺少必要文件 $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ 所有必要文件存在${NC}"
echo ""

# 创建必要的目录
echo -e "${YELLOW}[3/6] 创建数据目录...${NC}"
mkdir -p data logs
echo -e "${GREEN}✓ 数据目录创建完成${NC}"
echo ""

# 停止并删除旧容器（如果存在）
echo -e "${YELLOW}[4/6] 清理旧容器...${NC}"
if docker ps -a | grep -q pdf-field-extractor; then
    echo "停止并删除旧容器..."
    docker stop pdf-field-extractor 2>/dev/null || true
    docker rm pdf-field-extractor 2>/dev/null || true
    echo -e "${GREEN}✓ 旧容器已清理${NC}"
else
    echo -e "${GREEN}✓ 无旧容器需要清理${NC}"
fi
echo ""

# 构建镜像
echo -e "${YELLOW}[5/6] 构建 Docker 镜像...${NC}"
echo "这可能需要 10-20 分钟，请耐心等待..."
if command -v docker-compose &> /dev/null; then
    docker-compose build
else
    docker compose build
fi
echo -e "${GREEN}✓ 镜像构建完成${NC}"
echo ""

# 启动容器
echo -e "${YELLOW}[6/6] 启动容器...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# 等待容器启动
echo "等待容器启动..."
sleep 5

# 检查容器状态
if docker ps | grep -q pdf-field-extractor; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "✓ 部署成功！"
    echo -e "==========================================${NC}"
    echo ""
    echo "容器状态:"
    docker ps --filter name=pdf-field-extractor
    echo ""
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):5000"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker logs pdf-field-extractor"
    echo "  停止容器: docker stop pdf-field-extractor"
    echo "  启动容器: docker start pdf-field-extractor"
    echo "  重启容器: docker restart pdf-field-extractor"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================="
    echo -e "✗ 部署失败！"
    echo -e "==========================================${NC}"
    echo ""
    echo "查看错误日志:"
    docker logs pdf-field-extractor
    exit 1
fi
