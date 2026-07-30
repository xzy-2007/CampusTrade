# Deployment

## 1. 本地启动

### 1.1 前置条件

| 软件 | 版本要求 |
|---|---|
| Node.js | >= 18.0.0（推荐 18 或 20，v24 不兼容） |
| npm | 与 Node.js 配套 |
| MySQL | 8.0 |

### 1.2 数据库初始化

```bash
# 登录 MySQL 并创建数据库
mysql -u root -p
CREATE DATABASE IF NOT EXISTS campus_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

数据库迁移在应用启动时自动执行（`configuration.ts` 中 `onReady()` 调用 `dataSource.runMigrations()`），无需手动执行 SQL。

### 1.3 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接信息：
#   DATABASE_HOST=127.0.0.1
#   DATABASE_PORT=3306
#   DATABASE_USER=root
#   DATABASE_PASSWORD=your_password
#   DATABASE_NAME=campus_trade

# 开发模式启动（自动编译 + 热重载）
npm run dev

# 或：生产模式
npm run build
npm start
```

后端默认监听端口：**7001**

### 1.4 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 设置 API 地址：
#   NEXT_PUBLIC_API_URL=http://localhost:7001/api

# 开发模式启动
npm run dev

# 或：生产构建
npm run build
npm start
```

前端默认监听端口：**3000**

### 1.5 种子数据

首次启动后，可运行以下命令初始化演示数据：

```bash
cd backend
npm run seed
```

种子数据包含 4 个分类、3 个测试用户（密码统一 `123456`）和 6 件商品（含已审核、待审核、已售三种状态）。种子数据仅在数据库为空时插入，不影响已有数据。

详细种子数据内容见 [README.md#Seed 数据](../README.md)。

## 2. Docker 启动

### 2.1 一键启动（推荐）

项目根目录提供 `docker-compose.yml`，包含三个服务：

```bash
# 在项目根目录执行

# 构建镜像
docker compose build

# 启动所有服务
docker compose up

# 后台运行
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

### 2.2 服务架构

```
docker compose up
  │
  ├── mysql:8 (3306)
  │     └── healthcheck: mysqladmin ping
  │
  ├── backend (7001)
  │     └── depends_on: mysql (condition: service_healthy)
  │
  └── frontend (3000)
        └── depends_on: backend
```

### 2.3 启动后访问

| 服务 | 地址 |
|---|---|
| 前端页面 | http://localhost:3000 |
| 后端 API | http://localhost:7001/api |

### 2.4 后端单独启动

`backend/` 目录下也包含独立的 `docker-compose.yml`，仅启动后端 + MySQL：

```bash
cd backend
docker compose up
```

### 2.5 构建说明

#### 后端 Dockerfile

- **Builder 阶段**：安装依赖 → `npm run build` 编译 TypeScript 到 `dist/`
- **Runner 阶段**：仅复制 `dist/`、`node_modules/`、`package.json`，使用 `tini` 作为 init 进程

#### 前端 Dockerfile

- **Builder 阶段**：`npm ci` 安装依赖 → `npm run build` 构建 Next.js standalone 产物
- **Runner 阶段**：仅复制 `.next/standalone`、`.next/static`、`public/`，使用 `nextjs` 非 root 用户运行
- `NEXT_PUBLIC_API_URL` 作为构建参数（build arg）传入，默认 `http://localhost:7001/api`

## 3. 环境变量说明

### 3.1 后端环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `NODE_ENV` | `production` | 运行环境，`local` 时开启 `synchronize` 和 SQL 日志 |
| `API_PORT` | `7001` | 后端 HTTP 监听端口 |
| `DATABASE_HOST` | `127.0.0.1` | MySQL 主机地址 |
| `DATABASE_PORT` | `3306` | MySQL 端口 |
| `DATABASE_USER` | `root` | MySQL 用户名 |
| `DATABASE_PASSWORD` | （空） | MySQL 密码 |
| `DATABASE_NAME` | `campus_trade` | 数据库名 |
| `JWT_SECRET` | `campus-trade-default-secret` | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | `7d` | JWT 令牌有效期 |

### 3.2 前端环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:7001/api` | 后端 API 地址，编译时内联 |

### 3.3 Docker 额外环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `root123` | Docker MySQL root 密码 |

### 3.4 环境配置文件

| 文件 | 位置 | 用途 |
|---|---|---|
| `.env` | 项目根目录 | Docker Compose 环境变量 |
| `.env` | `backend/` | 后端本地开发 |
| `.env.local` | `frontend/` | 前端本地开发 |

## 4. 数据库初始化

### 4.1 自动迁移

启动时自动执行 TypeORM migration，不依赖 `synchronize: true`：

```typescript
// src/configuration.ts
async onReady() {
  if (this.dataSource.isInitialized) {
    await this.dataSource.runMigrations();
  }
}
```

### 4.2 迁移文件

| 文件 | 说明 |
|---|---|
| `src/migration/1712345678901-CreateInitialTables.ts` | 创建全部 6 张表，含索引、外键、唯一约束 |

### 4.3 迁移内容

| 表名 | 说明 |
|---|---|
| `users` | 用户表，含 `email` 唯一索引、`role` 索引 |
| `categories` | 分类表 |
| `goods` | 商品表，含 `user_id`、`category_id`、`status`、`(status, created_at)` 复合索引 |
| `favorites` | 收藏表，含 `(user_id, goods_id)` 唯一约束 |
| `orders` | 订单表，含 `buyer_id`、`seller_id`、`goods_id`、`status`、`(buyer_id, status)`、`(seller_id, status)` 索引 |
| `review_records` | 审核记录表，含 `goods_id`、`admin_id`、`created_at` 索引 |

### 4.4 手动迁移

如需手动执行迁移：

```bash
cd backend
# 开发环境下自动执行（NODE_ENV=local），也可通过 TypeORM CLI 手动控制
```

### 4.5 数据持久化（Docker）

Docker 部署时 MySQL 数据持久化到 volume `mysql_data`，容器重启后数据不丢失。

```yaml
volumes:
  mysql_data:
```

### 4.6 数据库连接参数

| 参数 | 值 |
|---|---|
| 字符集 | `utf8mb4` |
| 时区 | `+08:00` |
| 迁移记录表 | `migrations_history` |