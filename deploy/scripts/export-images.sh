#!/bin/bash
# CampusTrade Docker 镜像导出脚本 (Linux/macOS)
# 用法: bash export-images.sh
# 产物输出到 deploy/images/

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/images"

mkdir -p "$OUTPUT_DIR"

echo "=== 1. 构建镜像 ==="
cd "$PROJECT_DIR/.."
docker compose build

echo ""
echo "=== 2. 查看已构建的镜像名 ==="
docker images --format "{{.Repository}}:{{.Tag}}" | grep campus-trade || true

echo ""
echo "=== 3. 导出镜像 ==="
if docker image inspect campus-trade-backend:latest >/dev/null 2>&1; then
  docker save campus-trade-backend:latest -o "$OUTPUT_DIR/campus-trade-backend.tar"
elif docker image inspect campus-trade_backend:latest >/dev/null 2>&1; then
  docker save campus-trade_backend:latest -o "$OUTPUT_DIR/campus-trade-backend.tar"
else
  echo "ERROR: cannot find backend image"
  exit 1
fi

if docker image inspect campus-trade-frontend:latest >/dev/null 2>&1; then
  docker save campus-trade-frontend:latest -o "$OUTPUT_DIR/campus-trade-frontend.tar"
elif docker image inspect campus-trade_frontend:latest >/dev/null 2>&1; then
  docker save campus-trade_frontend:latest -o "$OUTPUT_DIR/campus-trade-frontend.tar"
else
  echo "ERROR: cannot find frontend image"
  exit 1
fi

echo ""
echo "=== 4. 导出完成 ==="
ls -lh "$OUTPUT_DIR/"