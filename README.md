# CampusTrade 校园二手交易平台

校园二手交易平台，支持商品发布、审核、下单购买、订单管理等完整交易流程，采用 JWT 认证、乐观锁并发控制，提供 Docker 一键部署。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | Midway.js 3.x (Egg.js) | ^3.0.0 |
| 前端框架 | Next.js 16 (App Router) | 16.2.10 |
| 语言 | TypeScript | 5.x |
| ORM | TypeORM | 0.3.x |
| 数据库 | MySQL 8 | — |
| 认证 | JWT (jsonwebtoken) + bcrypt | — |
| 前端样式 | TailwindCSS 4 | — |
| HTTP 客户端 | Axios | ^1.18.1 |
| 容器化 | Docker + Docker Compose | — |

## 系统架构

```
┌──────────────┐        HTTP/JSON        ┌──────────────┐
│   Frontend    │ ◄──────────────────────► │   Backend    │
│  Next.js 16   │     localhost:7001      │  Midway.js   │
│  App Router   │                          │  27 APIs     │
│  TailwindCSS  │                          │  TypeORM     │
└──────────────┘                          └──────┬───────┘
                                                 │
                                                 │ MySQL:3306
                                                 ▼
                                          ┌──────────────┐
                                          │    MySQL 8   │
                                          │  campus_trade│
                                          └──────────────┘
```

### 目录结构

```
CampusTrade/
├── backend/                    # 后端服务 (Midway.js)
│   ├── src/
│   │   ├── controller/         # 7 个控制器，27 个接口
│   │   ├── service/            # 7 个服务层
│   │   ├── entity/             # 6 个实体 + 4 个枚举
│   │   ├── middleware/         # JWT 认证中间件
│   │   ├── config/             # 环境配置
│   │   ├── migration/          # 数据库迁移
│   │   ├── dto/                # 8 个请求 DTO
│   │   └── bootstrap.ts        # 启动入口
│   ├── test/                   # 40 个测试用例
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                   # 前端应用 (Next.js)
│   ├── src/
│   │   ├── app/                # 12 个页面路由
│   │   ├── components/         # 7 个公共组件
│   │   ├── lib/                # API 客户端 + Auth 工具
│   │   ├── hooks/              # useAuth 自定义 Hook
│   │   └── types/              # 6 个类型定义文件
│   └── .env.example
│
└── docs/                       # 文档
    ├── APIDesign.md            # 接口设计方案
    └── APIImplementationReview.md  # 实现验证报告
```

## 功能模块

### 用户认证 (Auth)
- 注册 (`POST /api/auth/register`) — 用户名、邮箱、密码
- 登录 (`POST /api/auth/login`) — 返回 JWT token + 用户信息
- 当前用户 (`GET /api/auth/me`) — 获取已登录用户信息
- 密码使用 bcrypt 哈希存储，**不返回 passwordHash**

### 商品管理 (Goods)
- 发布商品 (`POST /api/goods`) — 提交后状态为 `PendingReview`
- 编辑商品 (`PUT /api/goods/{id}`) — 仅本人可编辑
- 下架商品 (`DELETE /api/goods/{id}`) — 软删除，状态置为 `Removed`
- 浏览商品 (`GET /api/goods`) — 仅返回 `Approved` 状态商品，支持搜索和分类筛选
- 商品详情 (`GET /api/goods/{id}`) — 本人可查看审核信息
- 重新提交 (`PUT /api/goods/{id}/resubmit`) — 驳回后修改并重新提交审核

### 商品审核 (Admin)
- 待审核列表 (`GET /api/admin/goods`) — 仅管理员
- 审核通过/驳回 (`PUT /api/admin/goods/{id}/review`) — 驳回时 reason 必填
- 强制下架 (`PUT /api/admin/goods/{id}/force-remove`) — 任意状态 → `Removed`
- 审核记录 (`GET /api/admin/review-records`) — 分页查看

### 收藏 (Favorite)
- 添加收藏 (`POST /api/favorites`) — 唯一约束防重复
- 取消收藏 (`DELETE /api/favorites/{goodsId}`)
- 收藏列表 (`GET /api/favorites`) — 分页

### 订单 (Order)
- 创建订单 (`POST /api/orders`) — 乐观锁并发控制
- 卖家确认 (`PUT /api/orders/{id}/seller-confirm`)
- 买家确认收货 (`PUT /api/orders/{id}/buyer-confirm`)
- 取消订单 (`PUT /api/orders/{id}/cancel`)
- 订单列表 (`GET /api/orders`)
- 订单详情 (`GET /api/orders/{id}`)

### 分类 (Category)
- 分类列表 (`GET /api/categories`) — 公开接口

## 数据库设计

### 6 张表

| 表名 | 说明 | 核心字段 |
|------|------|---------|
| `users` | 用户表 | id, username, email, password_hash, role(user/admin), avatar, phone |
| `categories` | 分类表 | id, name, description |
| `goods` | 商品表 | id, title, description, price, images(JSON), status, **version**(乐观锁), user_id(FK), category_id(FK) |
| `favorites` | 收藏表 | id, user_id(FK), goods_id(FK), **唯一约束**(user_id, goods_id) |
| `orders` | 订单表 | id, buyer_id(FK), seller_id(FK), goods_id(FK), status |
| `review_records` | 审核记录表 | id, goods_id(FK), admin_id(FK), action, reason |

### 商品状态机

```
                    ┌──────────────────────────────────┐
                    │           PendingReview           │
                    │  (发布/重新提交)                   │
                    └──────┬───────────────┬───────────┘
                           │               │
                    ┌──────▼──────┐  ┌─────▼────────┐
                    │  Approved   │  │   Rejected   │
                    │  (审核通过)  │  │  (审核驳回)   │
                    └──┬────┬─────┘  └──────┬────────┘
                       │    │               │
                  ┌────▼┐   │         (重新提交)
                  │Reserved│ │               │
                  │(下单)  │ │               │
                  └──┬────┘ │               │
                     │      │               │
              ┌──────▼──┐   │               │
              │   Sold  │   │               │
              │(确认收货)│   │               │
              └─────────┘   │               │
                            │               │
                     ┌──────▼───────────────▼──┐
                     │         Removed          │
                     │   (用户下架/管理员强制下架) │
                     └──────────────────────────┘
```

### 订单状态机

```
Pending ──► Confirmed ──► Completed
   │
   └──► Cancelled
```

| 状态变化 | 触发 | 备注 |
|---------|------|------|
| null → Pending | 买家下单 | Goods: Approved → Reserved |
| Pending → Confirmed | 卖家确认 | — |
| Confirmed → Completed | 买家确认收货 | Goods: Reserved → Sold |
| Pending → Cancelled | 买家取消 | Goods: Reserved → Approved |

## API 说明

共 27 个接口，前缀 `/api`。

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/goods` | 浏览商品列表 |
| GET | `/api/goods/{id}` | 商品详情 |
| GET | `/api/categories` | 分类列表 |

### 需登录接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/me` | 当前用户信息 |
| GET | `/api/users/profile` | 个人资料 |
| PUT | `/api/users/profile` | 编辑资料 |
| GET | `/api/users/goods` | 我的商品 |
| GET | `/api/users/favorites` | 我的收藏 |
| POST | `/api/goods` | 发布商品 |
| PUT | `/api/goods/{id}` | 编辑商品 |
| DELETE | `/api/goods/{id}` | 下架商品 |
| PUT | `/api/goods/{id}/resubmit` | 重新提交 |
| POST | `/api/favorites` | 收藏商品 |
| DELETE | `/api/favorites/{goodsId}` | 取消收藏 |
| GET | `/api/favorites` | 收藏列表 |
| POST | `/api/orders` | 创建订单 |
| GET | `/api/orders` | 订单列表 |
| GET | `/api/orders/{id}` | 订单详情 |
| PUT | `/api/orders/{id}/seller-confirm` | 卖家确认 |
| PUT | `/api/orders/{id}/buyer-confirm` | 买家确认收货 |
| PUT | `/api/orders/{id}/cancel` | 取消订单 |

### 管理员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/goods` | 待审核商品列表 |
| PUT | `/api/admin/goods/{id}/review` | 审核商品 |
| PUT | `/api/admin/goods/{id}/force-remove` | 强制下架 |
| GET | `/api/admin/review-records` | 审核记录 |

### 认证方式

请求头：`Authorization: Bearer <token>`

前端自动注入：`src/lib/api.ts` 的 Axios 拦截器从 `localStorage` 读取 token 并添加到请求头。

## JWT 认证

- 登录成功后返回 `token`（JWT）和 `user` 对象
- token 默认有效期 7 天，包含 `userId` 和 `role`
- 密码使用 bcrypt 哈希存储
- 后端 `AuthMiddleware` 校验 token 有效性，解析后将用户信息挂载到 `ctx.state`
- 管理员接口额外校验 `role === 'admin'`
- 401 响应时前端自动清除 token 并跳转 `/login`

## 并发控制

### Goods.version 乐观锁

订单创建接口 `POST /api/orders` 使用乐观锁防止超卖：

```
BEGIN TRANSACTION
  SELECT goods WHERE id = :goodsId AND status = 'Approved' AND version = :goodsVersion
  IF NOT FOUND → ROLLBACK, 返回 409
  UPDATE goods SET status = 'Reserved', version = version + 1
    WHERE id = :goodsId AND version = :goodsVersion AND status = 'Approved'
  IF affectedRows = 0 → ROLLBACK, 返回 409
  INSERT INTO orders (buyerId, sellerId, goodsId, status = 'Pending')
COMMIT
```

关键点：
- 原子操作：`UPDATE ... SET version = version + 1` 由数据库执行，非应用程序计算
- 前端传入 `goodsVersion`（从商品详情接口获取 `goods.version` 字段）
- 并发冲突时返回 HTTP 409，提示"商品已被其他用户购买"
- 测试覆盖：2 个并发测试用例验证同一商品被 2 人同时抢购时，恰好 1 人成功、1 人失败

### 事务使用

以下操作使用 TypeORM `QueryRunner` 手动事务：

| 操作 | 涉及表 |
|------|--------|
| 创建订单 | goods (status+version), orders |
| 买家确认收货 | orders (status), goods (status) |
| 取消订单 | orders (status), goods (status) |
| 审核商品 | goods (status), review_records |

## 前后端启动方式

### 前置条件

- Node.js >= 18.0.0
- MySQL 8

### 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量 (复制并修改)
cp .env.example .env
# 编辑 .env 填入数据库配置

# 开发模式启动 (自动编译 + 热重载)
npm run dev

# 或：编译 + 生产启动
npm run build
npm start
```

端口：7001

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 开发模式启动
npm run dev
```

端口：3000

## Docker 部署方式

项目根目录提供了 `docker-compose.yml`，可一键启动 MySQL、后端和前端服务。

```bash
# 在项目根目录执行

# 构建并启动
docker compose build
docker compose up

# 后台运行
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

启动后访问：
- 前端页面：http://localhost:3000
- 后端 API：http://localhost:7001/api

### 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| mysql | 3306 | MySQL 8，数据持久化到 volume `mysql_data` |
| backend | 7001 | 后端 API，依赖 MySQL 健康检查通过后启动 |
| frontend | 3000 | Next.js 前端页面，依赖 backend 启动后运行 |

### 前端构建说明

前端使用 Next.js 的 `output: 'standalone'` 模式进行 Docker 多阶段构建：
- **Builder 阶段**：安装依赖、构建生产包
- **Runner 阶段**：仅复制 `.next/standalone` 产物，使用 `nextjs` 用户（非 root）运行

`NEXT_PUBLIC_API_URL` 作为构建参数传入，默认指向 `http://localhost:7001/api`（即宿主机上 backend 映射的端口）。

### 后端说明

> 后端 Dockerfile 和 docker-compose 也位于 `backend/` 目录，可直接在 `backend/` 下单独启动后端服务。

### 环境变量

通过 `.env` 文件或直接设置环境变量覆盖默认值：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | root123 | MySQL root 密码 |
| `JWT_SECRET` | campus-trade-jwt-secret | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | 7d | JWT 有效期 |

### Seed 数据

首次启动后，可运行以下命令初始化演示数据：

```bash
cd backend
npm run seed
```

执行后将在数据库中创建：

**分类（4 个）：** 数码电子、图书教材、生活用品、运动装备

**测试账号（3 个）：**

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 学生 | `student1@test.com` | `123456` |
| 学生 | `student2@test.com` | `123456` |
| 管理员 | `admin@test.com` | `123456` |

**商品（6 个）：**

| 商品 | 发布者 | 状态 |
|------|--------|------|
| 二手 iPhone 14 128GB | student1 | ✅ Approved |
| 高等数学（第七版）上册 | student1 | ✅ Approved |
| 宿舍USB充电台灯 | student1 | ⏳ PendingReview |
| 尤尼克斯羽毛球拍 | student2 | ✅ Approved |
| 英语四级真题 2024版 | student2 | 💰 Sold（已售给 student1） |
| JBL便携蓝牙音箱 | student2 | ⏳ PendingReview |

> 密码使用 bcrypt 加密存储。种子数据仅在数据库为空时插入，不影响已有数据。

### Migration

启动时自动执行 TypeORM migration（通过 `configuration.ts` 中 `onReady()` 调用 `dataSource.runMigrations()`），不依赖 `synchronize: true`。

## 测试情况

### 后端测试

共 40 个测试用例，使用 Jest + `@midwayjs/mock`。

#### 集成测试 (`test/api.test.ts`) — 34 个用例

| 模块 | 用例数 | 覆盖内容 |
|------|--------|---------|
| Auth | 7 | 注册成功、邮箱重复 409、登录成功、密码错误 401、获取用户信息、未授权 401 |
| User | 4 | 获取/编辑资料、我的商品、我的收藏 |
| Category | 1 | 分类列表 |
| Goods | 4 | 发布商品、列表查询、详情查看 |
| Admin Review | 4 | 待审核列表、审核通过、商品可见性、审核记录 |
| Favorite | 5 | 添加、重复添加 409、列表、删除、删除后为空 |
| Order | 5 | 创建订单、重复下单 409、列表、详情、卖家确认、买家确认收货 |
| Admin Force Remove | 1 | 强制下架 |
| Resubmit | 3 | 驳回后重新提交、非驳回状态拒绝 400 |

#### 并发测试 (`test/concurrency.test.ts`) — 2 个用例

| 用例 | 说明 |
|------|------|
| 并发抢购 | 2 用户同时下单同一商品，精确 1 人成功 201、1 人冲突 409 |

### 测试限制

`@midwayjs/web` (Egg.js) 与 Node.js v24 不兼容，测试运行时会出现 `getAsyncLocalStorage is not a function` 错误。TypeScript 编译 (`npx tsc --noEmit`) 通过。建议使用 Node.js 18 或 20 运行测试。

### 前端构建

```bash
cd frontend
npm run build   # 编译通过，12 个路由全部正确生成
```

## 前端页面路由

| 路径 | 功能 | 状态 |
|------|------|------|
| `/` | 首页 | ✅ |
| `/login` | 登录 | ✅ |
| `/register` | 注册 | ✅ |
| `/goods` | 商品列表 | ✅ |
| `/goods/[id]` | 商品详情 | ✅ |
| `/goods/create` | 发布商品 | ✅ |
| `/orders` | 订单列表 | ✅ |
| `/orders/[id]` | 订单详情 | ✅ |
| `/favorites` | 收藏列表 | ✅ |
| `/profile` | 个人中心 | ✅ |
| `/admin` | 管理后台 | ✅ |

## 许可证

MIT