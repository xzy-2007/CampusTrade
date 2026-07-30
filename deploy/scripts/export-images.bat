@echo off
REM CampusTrade Docker 镜像导出脚本 (Windows)
REM 用法: export-images.bat
REM 产物输出到 deploy/images/

echo === 构建镜像 ===
cd /d "%~dp0..\.."
docker compose build

echo.
echo === 导出镜像 ===
docker save campus-trade-backend:latest -o deploy\images\campus-trade-backend.tar
docker save campus-trade-frontend:latest -o deploy\images\campus-trade-frontend.tar

echo.
echo === 导出完成 ===
dir /h deploy\images\