# Test Plan

## 1. 测试目标

- 验证 27 个 API 端点的功能正确性，覆盖用户注册、登录、商品 CRUD、审核、收藏、订单全流程
- 验证乐观锁并发控制的有效性，确保同一商品在并发下单时不会超卖
- 验证权限控制（未认证 401、非管理员 403、非本人 403）
- 验证边界条件（重复邮箱注册 409、重复收藏 409、重复下单 409、驳回后重新提交）

## 2. 测试环境

| 项目 | 说明 |
|---|---|
| 测试框架 | Jest 29 + `@midwayjs/mock` |
| 运行命令 | `cd backend && npm run test` |
| Node.js 版本 | 18 或 20（v24 不兼容，见下方限制） |
| 数据库 | 测试框架自动创建隔离的数据库连接 |
| 测试文件 | `test/api.test.ts`（34 个用例），`test/concurrency.test.ts`（2 个用例） |

## 3. 单元测试

当前项目暂无独立的单元测试文件。`tests/service/`、`tests/component/`、`tests/contract/`、`tests/e2e/` 目录均为空。

所有测试均为集成测试，通过 `@midwayjs/mock` 启动完整的 Midway 应用容器，使用 HTTP 请求调用 API 端点进行端到端验证。

## 4. API 集成测试

`test/api.test.ts` 共 34 个用例，覆盖 9 个模块：

### Auth（7 个用例）

| 用例 | 预期 |
|---|---|
| `POST /api/auth/register` — 注册新用户 | 201，返回 id、username、email |
| `POST /api/auth/register` — 重复邮箱 | 409 |
| `POST /api/auth/register` — 注册管理员 | 201 |
| `POST /api/auth/login` — 登录成功 | 200，返回 token 和 user |
| `POST /api/auth/login` — 密码错误 | 401 |
| `GET /api/auth/me` — 获取当前用户 | 200，不返回 passwordHash |
| `GET /api/auth/me` — 无 token | 401 |

### User（4 个用例）

| 用例 | 预期 |
|---|---|
| `GET /api/users/profile` | 200，返回用户信息，不含 passwordHash |
| `PUT /api/users/profile` — 更新资料 | 200，username 和 phone 更新成功 |
| `GET /api/users/goods` | 200，返回 `{ total, items }` |
| `GET /api/users/favorites` | 200，返回 `{ total, items }` |

### Category（1 个用例）

| 用例 | 预期 |
|---|---|
| `GET /api/categories` | 200，返回数组 |

### Goods（4 个用例）

| 用例 | 预期 |
|---|---|
| `POST /api/goods` — 发布商品 | 201，status 为 `PendingReview` |
| `GET /api/goods` — 未审核时不显示 | 200，total 为 0 |
| `GET /api/goods/:id` — 本人可见 | 200，返回商品详情 |
| `GET /api/goods/:id` — 游客不可见 | 404 |

### Admin - Review（4 个用例）

| 用例 | 预期 |
|---|---|
| `GET /api/admin/goods` — 待审核列表 | 200，total >= 1 |
| `PUT /api/admin/goods/:id/review` — 审核通过 | 200，status 变为 `Approved` |
| `GET /api/goods` — 审核后可见 | 200，total >= 1 |
| `GET /api/admin/review-records` — 审核记录 | 200，total >= 1 |

### Favorite（5 个用例）

| 用例 | 预期 |
|---|---|
| `POST /api/favorites` — 添加收藏 | 201 |
| `POST /api/favorites` — 重复收藏 | 409 |
| `GET /api/favorites` — 收藏列表 | 200，total >= 1 |
| `DELETE /api/favorites/:goodsId` — 取消收藏 | 200 |
| `GET /api/favorites` — 取消后为空 | 200，total 为 0 |

### Order（5 个用例）

| 用例 | 预期 |
|---|---|
| `POST /api/orders` — 创建订单 | 201，status 为 `Pending` |
| `POST /api/orders` — 重复下单 | 409 |
| `GET /api/orders` — 订单列表 | 200，total >= 1 |
| `GET /api/orders/:id` — 订单详情 | 200 |
| `PUT /api/orders/:id/seller-confirm` — 卖家确认 | 200，status 变为 `Confirmed` |
| `PUT /api/orders/:id/buyer-confirm` — 买家确认收货 | 200，status 变为 `Completed`，goodsStatus 为 `Sold` |

### Admin - Force Remove（1 个用例）

| 用例 | 预期 |
|---|---|
| `PUT /api/admin/goods/:id/force-remove` | 200，status 变为 `Removed` |

### Goods - Resubmit（3 个用例）

| 用例 | 预期 |
|---|---|
| 创建商品 → 管理员驳回 | 200 |
| `PUT /api/goods/:id/resubmit` — 重新提交 | 200，status 变为 `PendingReview` |
| `PUT /api/goods/:id/resubmit` — 非驳回状态拒绝 | 400 |

## 5. 并发测试

`test/concurrency.test.ts` 共 2 个用例：

### 前置准备

| 步骤 | 说明 |
|---|---|
| 注册 con-user1 | 测试用户 A |
| 注册 con-user2 | 测试用户 B |
| 注册 con-admin | 管理员 |
| 创建商品 → 管理员审核通过 | 商品状态转为 `Approved`，记录 `version` |

### 并发测试

| 用例 | 预期 |
|---|---|
| 两个用户同时调用 `POST /api/orders`（携带相同 `goodsVersion`） | 恰好一个收到 201（成功），一个收到 409（冲突） |

测试通过 `Promise.all` 并发发起两个请求，模拟真实并发场景。

## 6. 测试结果

### 运行方式

```bash
cd backend
npm run test
```

### 已知限制

| 问题 | 说明 |
|---|---|
| Node.js v24 兼容性 | `@midwayjs/web` 使用的 Egg.js 框架在 Node.js v24 下存在 `getAsyncLocalStorage is not a function` 错误，建议使用 Node.js 18 或 20 |
| 数据库依赖 | 测试需要 MySQL 数据库实例，测试前需确保数据库可访问且已执行 migration |
| 测试顺序依赖 | 测试用例间存在数据依赖（如 Order 测试依赖前面创建的 goodsId），必须按文件顺序执行 |
| 测试隔离 | 当前测试使用同一个数据库实例，不同测试文件间可能相互影响 |

### 覆盖率

| 指标 | 数据 |
|---|---|
| 测试文件数 | 2 |
| 测试用例数 | 36 |
| 集成测试覆盖模块 | 7 个 Controller，27 个 API 端点 |
| 并发测试覆盖场景 | 乐观锁并发购买 |
| 单元测试 | 暂无 |
| 前端测试 | 暂无 |
| E2E 测试 | 暂无 |