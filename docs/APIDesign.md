# CampusTrade API 设计方案

## 接口前缀

所有 API 以 `/api` 为前缀。

## 鉴权方式

- **无需认证**：Guest 可访问的公开接口
- **需要登录**：请求头携带 `Authorization: Bearer <token>`
- **需要管理员**：登录用户角色为 `admin`

---

## 1. Auth 模块

### POST /api/auth/register

| 项目 | 内容 |
|------|------|
| 描述 | 用户注册 |
| FR | FR-001 |
| 权限 | 无需认证 |
| Request Body | `{ username: string, email: string, password: string }` |
| Response 201 | `{ id: number, username: string, email: string }` |
| Response 409 | 邮箱已注册 |

### POST /api/auth/login

| 项目 | 内容 |
|------|------|
| 描述 | 用户登录，返回 JWT token |
| FR | FR-002 |
| 权限 | 无需认证 |
| Request Body | `{ email: string, password: string }` |
| Response 200 | `{ token: string, user: { id, username, email, role, avatar } }` |
| Response 401 | 邮箱或密码错误 |

### GET /api/auth/me

| 项目 | 内容 |
|------|------|
| 描述 | 获取当前登录用户信息 |
| FR | 辅助接口（支撑 FR-003） |
| 权限 | 需登录 |
| Response 200 | `{ id, username, email, role, avatar, phone }` |

---

## 2. User 模块

### GET /api/users/profile

| 项目 | 内容 |
|------|------|
| 描述 | 查看个人资料 |
| FR | FR-003 |
| 权限 | 需登录 |
| Response 200 | `{ id, username, email, avatar, phone, role, createdAt }` |

### PUT /api/users/profile

| 项目 | 内容 |
|------|------|
| 描述 | 编辑个人资料 |
| FR | FR-004 |
| 权限 | 需登录 |
| Request Body | `{ username?: string, avatar?: string, phone?: string }` |
| Response 200 | `{ id, username, avatar, phone }` |

### GET /api/users/goods

| 项目 | 内容 |
|------|------|
| 描述 | 查看我发布的商品列表（含审核状态、驳回理由） |
| FR | FR-005 |
| 权限 | 需登录 |
| Query | `?page=1&pageSize=20` |
| Response 200 | `{ total, items: [{ id, title, price, status, images, category, reviewReason, createdAt }] }` |

### GET /api/users/favorites

| 项目 | 内容 |
|------|------|
| 描述 | 查看我的收藏列表 |
| FR | FR-016 |
| 权限 | 需登录 |
| Query | `?page=1&pageSize=20` |
| Response 200 | `{ total, items: [{ id, goods: { id, title, price, images, status } }] }` |

---

## 3. Goods 模块

### POST /api/goods

| 项目 | 内容 |
|------|------|
| 描述 | 发布商品，提交后状态为 PendingReview |
| FR | FR-007 |
| 权限 | 需登录 |
| Request Body | `{ title: string, description: string, price: number, categoryId: number, images: string[] }` |
| Response 201 | `{ id, title, status: "PendingReview", createdAt }` |
| Response 400 | 必填项缺失 |

### PUT /api/goods/{id}

| 项目 | 内容 |
|------|------|
| 描述 | 编辑自己发布的商品信息 |
| FR | FR-008 |
| 权限 | 需登录，仅本人 |
| Request Body | `{ title?: string, description?: string, price?: number, categoryId?: number, images?: string[] }` |
| Response 200 | `{ id, title, status, updatedAt }` |
| Response 403 | 非本人商品 |

### DELETE /api/goods/{id}

| 项目 | 内容 |
|------|------|
| 描述 | 下架商品。非物理删除，将商品状态置为 Removed |
| FR | FR-009 |
| 权限 | 需登录，仅本人 |
| 前置条件 | 商品状态为 PendingReview 或 Approved |
| 状态变化 | PendingReview / Approved → Removed |
| Response 200 | `{ id, status: "Removed" }` |
| Response 403 | 非本人商品 |
| Response 400 | 商品当前状态不允许下架 |

### GET /api/goods

| 项目 | 内容 |
|------|------|
| 描述 | 浏览商品列表，支持分页、搜索、分类筛选。仅返回 Approved 状态商品 |
| FR | FR-010, FR-012, FR-013 |
| 权限 | 无需认证 |
| Query | `?page=1&pageSize=20&search=keyword&categoryId=1` |
| Response 200 | `{ total, page, pageSize, items: [{ id, title, price, images, category, user: { username }, createdAt }] }` |

### GET /api/goods/{id}

| 项目 | 内容 |
|------|------|
| 描述 | 查看商品详情。若为本人商品，额外返回审核信息（审核结果、驳回理由） |
| FR | FR-011 |
| 权限 | 无需认证（查看公开信息）；本人可查审核信息 |
| Response 200 | `{ id, title, description, price, images, status, category, user: { id, username, avatar }, createdAt, review?: { action, reason, adminName, createdAt } }` |

### PUT /api/goods/{id}/resubmit

| 项目 | 内容 |
|------|------|
| 描述 | 审核驳回后，修改并重新提交审核（Rejected → PendingReview） |
| FR | FR-007（重新提交） |
| 权限 | 需登录，仅本人 |
| 前置条件 | 商品状态为 Rejected |
| 状态变化 | Rejected → PendingReview |
| Request Body | `{ title, description, price, categoryId, images }` |
| Response 200 | `{ id, status: "PendingReview" }` |
| Response 400 | 商品状态非 Rejected |

---

## 4. Favorite 模块

### POST /api/favorites

| 项目 | 内容 |
|------|------|
| 描述 | 收藏商品 |
| FR | FR-014 |
| 权限 | 需登录 |
| Request Body | `{ goodsId: number }` |
| Response 201 | `{ id, goodsId, createdAt }` |
| Response 409 | 已收藏 |

### DELETE /api/favorites/{goodsId}

| 项目 | 内容 |
|------|------|
| 描述 | 取消收藏 |
| FR | FR-015 |
| 权限 | 需登录 |
| Response 200 | `{ message: "ok" }` |

### GET /api/favorites

| 项目 | 内容 |
|------|------|
| 描述 | 查看收藏列表（同 GET /api/users/favorites） |
| FR | FR-016 |
| 权限 | 需登录 |
| Query | `?page=1&pageSize=20` |
| Response 200 | `{ total, items: [...] }` |

---

## 5. Order 模块

### POST /api/orders

| 项目 | 内容 |
|------|------|
| 描述 | 创建订单（买家购买商品）。并发控制：使用乐观锁 version，在事务中校验 goods.status = Approved 且 goods.version = 传入版本号，原子更新 status = Reserved、version = version + 1 |
| FR | FR-017 |
| 权限 | 需登录，不能购买自己商品 |
| 前置条件 | goods.status = Approved，buyerId != sellerId |
| 状态变化 | Order: null → Pending；Goods: Approved → Reserved |
| Request Body | `{ goodsId: number, goodsVersion: number }` |
| Response 201 | `{ id, status: "Pending", goodsId, createdAt }` |
| Response 400 | 商品不可购买 / 购买自己商品 |
| Response 409 | 版本冲突，商品已被其他用户抢先下单 |

### PUT /api/orders/{id}/seller-confirm

| 项目 | 内容 |
|------|------|
| 描述 | 卖家确认交易 |
| FR | FR-018 |
| 权限 | 需登录，仅该商品卖家 |
| 前置条件 | 当前用户是 seller，order.status = Pending |
| 状态变化 | Order: Pending → Confirmed |
| Response 200 | `{ id, status: "Confirmed" }` |
| Response 400 | 订单状态非 Pending |
| Response 403 | 非卖家 |

### PUT /api/orders/{id}/buyer-confirm

| 项目 | 内容 |
|------|------|
| 描述 | 买家确认收货 |
| FR | FR-019 |
| 权限 | 需登录，仅该订单买家 |
| 前置条件 | 当前用户是 buyer，order.status = Confirmed |
| 状态变化 | Order: Confirmed → Completed；Goods: Reserved → Sold |
| Response 200 | `{ id, status: "Completed", goodsStatus: "Sold" }` |
| Response 400 | 订单状态非 Confirmed |
| Response 403 | 非买家 |

### PUT /api/orders/{id}/cancel

| 项目 | 内容 |
|------|------|
| 描述 | 买家取消订单 |
| FR | FR-020 |
| 权限 | 需登录，仅该订单买家 |
| 前置条件 | 当前用户是 buyer，order.status = Pending |
| 状态变化 | Order: Pending → Cancelled；Goods: Reserved → Approved |
| Response 200 | `{ id, status: "Cancelled", goodsStatus: "Approved" }` |
| Response 400 | 订单状态非 Pending |
| Response 403 | 非买家 |

### GET /api/orders

| 项目 | 内容 |
|------|------|
| 描述 | 查看我的订单列表。返回作为买家或卖家的所有订单 |
| FR | FR-021 |
| 权限 | 需登录 |
| Query | `?page=1&pageSize=20&role=buyer|seller&status=Pending` |
| Response 200 | `{ total, items: [{ id, status, goods: { id, title, price, images }, buyer, seller, createdAt }] }` |

### GET /api/orders/{id}

| 项目 | 内容 |
|------|------|
| 描述 | 查看订单详情（仅订单参与方可见） |
| FR | FR-022 |
| 权限 | 需登录，仅买家或卖家 |
| Response 200 | `{ id, status, goods, buyer, seller, createdAt, updatedAt }` |
| Response 403 | 非订单参与方 |

---

## 6. Category 模块

### GET /api/categories

| 项目 | 内容 |
|------|------|
| 描述 | 获取所有分类列表 |
| FR | FR-023 |
| 权限 | 无需认证 |
| Response 200 | `[{ id, name, description }]` |

---

## 7. Admin 模块

### GET /api/admin/goods

| 项目 | 内容 |
|------|------|
| 描述 | 获取待审核商品列表（PendingReview 状态），也可按状态筛选 |
| FR | 辅助接口（支撑 FR-024） |
| 权限 | 需管理员 |
| Query | `?status=PendingReview&page=1&pageSize=20` |
| Response 200 | `{ total, items: [{ id, title, price, images, user: { username }, status, createdAt }] }` |

### PUT /api/admin/goods/{id}/review

| 项目 | 内容 |
|------|------|
| 描述 | 审核商品 |
| FR | FR-024 |
| 权限 | 需管理员 |
| 前置条件 | goods.status = PendingReview |
| 状态变化 | 通过: PendingReview → Approved；驳回: PendingReview → Rejected |
| Request Body | `{ action: "approved" | "rejected", reason?: string }` |
| 规则 | action 为 rejected 时 reason 必填 |
| Response 200 | `{ id, status: "Approved" | "Rejected" }` |
| Response 400 | 商品状态非 PendingReview / 驳回时未填写理由 |

### PUT /api/admin/goods/{id}/force-remove

| 项目 | 内容 |
|------|------|
| 描述 | 强制下架商品（任意状态 → Removed） |
| FR | FR-025 |
| 权限 | 需管理员 |
| 状态变化 | 任意状态 → Removed |
| Response 200 | `{ id, status: "Removed" }` |

### GET /api/admin/review-records

| 项目 | 内容 |
|------|------|
| 描述 | 查看所有审核记录 |
| FR | FR-026 |
| 权限 | 需管理员 |
| Query | `?page=1&pageSize=20&goodsId=1` |
| Response 200 | `{ total, items: [{ id, goods: { id, title }, admin: { username }, action, reason, createdAt }] }` |

---

## 状态覆盖检查

### 商品状态

| 状态 | 触发接口 | 说明 |
|------|---------|------|
| PendingReview | POST /api/goods, PUT /api/goods/{id}/resubmit | 提交审核或重新提交 |
| Rejected | PUT /api/admin/goods/{id}/review (action=rejected) | 审核驳回 |
| Approved | PUT /api/admin/goods/{id}/review (action=approved) | 审核通过 |
| Reserved | POST /api/orders | 买家下单成功 |
| Sold | PUT /api/orders/{id}/buyer-confirm | 买家确认收货 |
| Removed | DELETE /api/goods/{id}, PUT /api/admin/goods/{id}/force-remove | 用户下架或管理员强制下架 |

### 订单状态

| 状态 | 触发接口 | 说明 |
|------|---------|------|
| Pending | POST /api/orders | 创建订单 |
| Confirmed | PUT /api/orders/{id}/seller-confirm | 卖家确认交易 |
| Completed | PUT /api/orders/{id}/buyer-confirm | 买家确认收货 |
| Cancelled | PUT /api/orders/{id}/cancel | 买家取消订单 |

---

## 关键设计说明

### 商品抢购并发控制

`POST /api/orders` 接收 `goodsVersion` 参数，后端在数据库事务中执行：

```
BEGIN TRANSACTION
  SELECT goods WHERE id = :goodsId AND status = 'Approved' AND version = :goodsVersion
  IF NOT FOUND → ROLLBACK, 返回 409
  UPDATE goods SET status = 'Reserved', version = version + 1 WHERE id = :goodsId AND version = :goodsVersion
  IF affectedRows = 0 → ROLLBACK, 返回 409
  INSERT INTO orders (userId, goodsId, status, ...)
COMMIT
```

### 审核驳回重新提交

`PUT /api/goods/{id}/resubmit` 仅在商品状态为 `Rejected` 时可用，调用后进入 `PendingReview`，等待管理员重新审核。

### 接口权限原则

- **公开接口**：GET /api/goods, GET /api/goods/{id}, GET /api/categories, POST /api/auth/register, POST /api/auth/login
- **用户级**：需登录，且只能操作自己的资源
- **卖家级**：PUT /api/orders/{id}/seller-confirm 需校验当前用户为该商品卖家
- **管理员级**：Admin 模块所有接口