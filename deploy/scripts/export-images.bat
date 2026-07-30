@echo off
REM CampusTrade Docker 镜像导出脚本 (Windows)
REM 用法: export-images.bat
REM 产物输出到 deploy/images/

echo === 1. 构建镜像 ===
cd /d "%~dp0..\.."
docker compose build

echo.
echo === 2. 查看已构建的镜像名 ===
docker images --format "{{.Repository}}:{{.Tag}}" | findstr campus-trade

echo.
echo === 3. 导出镜像 ===
docker save campus-trade-backend:latest -o deploy\images\campus-trade-backend.tar 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [!] campus-trade-backend not found, trying campus-trade_backend...
  docker save campus-trade_backend:latest -o deploy\images\campus-trade-backend.tar
)

docker save campus-trade-frontend:latest -o deploy\images\campus-trade-frontend.tar 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [!] campus-trade-frontend not found, trying campus-trade_frontend...
  docker save campus-trade_frontend:latest -o deploy\images\campus-trade-frontend.tar
)

echo.
echo === 4. 导出完成 ===
dir deploy\images\*.tar