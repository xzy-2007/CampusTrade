#!/bin/bash
# CampusTrade Docker 镜像导出脚本
# 用法: bash export-images.sh
# 产物输出到 deploy/images/

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/images"

mkdir -p "$OUTPUT_DIR"

echo "=== 构建镜像 ==="
cd "$PROJECT_DIR/.."
docker compose build

echo ""
echo "=== 导出镜像 ==="
docker save campus-trade-backend:latest -o "$OUTPUT_DIR/campus-trade-backend.tar"
docker save campus-trade-frontend:latest -o "$OUTPUT_DIR/campus-trade-frontend.tar"

echo ""
echo "=== 导出完成 ==="
ls -lh "$OUTPUT_DIR/"