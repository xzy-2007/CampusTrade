# CampusTrade

## 1. 项目简介

CampusTrade 是一个面向高校师生的校园内二手交易平台，旨在解决校园场景下二手物品信息分散、交易信任成本高的问题。平台提供商品浏览、搜索、发布、收藏、模拟购买及管理员审核等核心功能，帮助在校师生便捷地进行二手物品流转。

## 2. GitHub 仓库地址

https://github.com/xzy-2007/CampusTrade

（若为私有仓库，请邀请 sunshirezxf@hotmail.com 作为协作者）

## 3. 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) |
| 样式方案 | TailwindCSS 4 |
| 后端框架 | Midway.js 3.x |
| ORM | TypeORM 0.3.x |
| 数据库 | MySQL 8 |
| 接口规范 | OpenAPI 3.0 (contract-first) |
| 版本控制 | Git |
| 容器化 | Docker / Docker Compose |

## 4. Docker 启动方式

### 前置条件

- Docker Engine >= 24.0
- Docker Compose >= 2.0

### Docker Compose 启动命令（推荐）

```bash
# 在项目根目录执行

# 构建并启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

启动后访问：
- 前端页面：http://localhost:3000
- 后端 API：http://localhost:7001/api

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 学生 | student1@test.com | 123456 |
| 学生 | student2@test.com | 123456 |
| 管理员 | admin@test.com | 123456 |

（首次启动后需执行 `cd backend && npm run seed` 初始化演示数据）

### Docker Image 启动命令

```bash
# 加载镜像
docker load -i deploy/images/campus-trade-backend.tar
docker load -i deploy/images/campus-trade-frontend.tar

# 启动 MySQL
docker run -d --name campus-trade-mysql \
  -e MYSQL_DATABASE=campus_trade \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -v mysql_data:/var/lib/mysql \
  mysql:8

# 启动后端
docker run -d --name campus-trade-backend \
  -p 7001:7001 \
  -e DATABASE_HOST=campus-trade-mysql \
  -e DATABASE_PASSWORD=root123 \
  --link campus-trade-mysql \
  campus-trade-backend:latest

# 启动前端
docker run -d --name campus-trade-frontend \
  -p 3000:3000 \
  --link campus-trade-backend \
  campus-trade-frontend:latest
```

## 5. 数据库配置和挂载说明

### 数据库配置

系统通过环境变量配置数据库连接：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DATABASE_HOST | 127.0.0.1 | MySQL 主机地址 |
| DATABASE_PORT | 3306 | MySQL 端口 |
| DATABASE_USER | root | MySQL 用户名 |
| DATABASE_PASSWORD | (空) | MySQL 密码 |
| DATABASE_NAME | campus_trade | 数据库名 |

数据库迁移在应用启动时自动执行（TypeORM Migration），无需手动导入 SQL。

### 数据持久化挂载

```yaml
volumes:
  - mysql_data:/var/lib/mysql
```

## 6. 资源文件挂载说明

### 图片资源挂载

商品图片当前使用外部 URL（picsum.photos），本地资源目录作为预留：

```yaml
volumes:
  - ./resources/goods:/app/resources/goods
  - ./resources/avatar:/app/resources/avatar
```

## 7. Web 访问地址

### 前端页面

http://localhost:3000（本地部署，无公网地址）

### 后端 API 服务

http://localhost:7001/api（本地部署，无公网地址）

## 8. 本地运行说明

### 环境要求

- Node.js >= 18（推荐 20，v24 不兼容）
- MySQL >= 8.0
- npm

### 后端启动

```bash
cd backend
npm install
cp .env.example .env    # 编辑 .env 填入数据库配置
npm run dev              # 开发模式（热重载）
```

### 前端启动

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev              # 开发模式
```

### 种子数据初始化

```bash
cd backend
npm run seed
```

## 9. 课程学习总结

（可选，由学生填写）

## 10. 课程改进建议

（可选，由学生填写）