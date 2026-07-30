# CampusTrade 数据库设计文档

版本：v1.0

日期：2026-07-19

---

## 1. ER 关系说明

### 1.1 实体关系总览

```
User ──1:N──→ Goods         (一个用户可发布多件商品)
User ──1:N──→ Favorite       (一个用户可收藏多件商品)
User ──1:N──→ Order (buyer)  (一个买家可创建多个订单)
User ──1:N──→ Order (seller) (一个卖家可接收多个订单)
User ──1:N──→ ReviewRecord   (一个管理员可执行多次审核)
Category ──1:N──→ Goods      (一个分类下可有多件商品)
Goods ──1:N──→ Favorite      (一件商品可被多个用户收藏)
Goods ──1:N──→ Order         (一件商品可关联多个订单，但仅一个有效订单)
Goods ──1:N──→ ReviewRecord   (一件商品可有多条审核记录)
```

### 1.2 核心关系说明

- **User 与 Order**：Order 通过 buyer_id 和 seller_id 分别关联 User 表，记录买家与卖家信息。即使后续用户修改用户名，订单中的 buyerId/sellerId 仍指向原始用户记录，保证历史一致性。
- **Goods 与 Order**：一件商品同一时间只能有一个有效订单（状态为 Pending 或 Confirmed）。通过商品状态 Reserved 和乐观锁 version 保证。
- **Goods 与 ReviewRecord**：商品每次审核操作均记录一条审核记录，支持审计追溯。

---

## 2. 数据表设计

### 2.1 User（用户表）

| 字段名 | 类型 | 可为空 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| id | INT | NOT NULL | AUTO_INCREMENT | 主键，用户唯一标识 |
| username | VARCHAR(50) | NOT NULL | — | 用户昵称，前台展示 |
| email | VARCHAR(100) | NOT NULL | — | 登录凭证，唯一 |
| password_hash | VARCHAR(255) | NOT NULL | — | 密码哈希值，加密存储 |
| avatar | VARCHAR(255) | YES | NULL | 头像图片路径 |
| phone | VARCHAR(20) | YES | NULL | 联系方式 |
| role | ENUM('user','admin') | NOT NULL | 'user' | 角色标识 |
| is_active | TINYINT(1) | NOT NULL | 1 | 账号是否被禁用，1=启用，0=禁用 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 注册时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 信息更新时间 |

**主键**：`PRIMARY KEY (id)`

**唯一约束**：`UNIQUE KEY uk_email (email)`

**索引**：`INDEX idx_role (role)`

---

### 2.2 Category（分类表）

| 字段名 | 类型 | 可为空 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| id | INT | NOT NULL | AUTO_INCREMENT | 主键，分类唯一标识 |
| name | VARCHAR(50) | NOT NULL | — | 分类名称 |
| description | VARCHAR(255) | YES | NULL | 分类描述 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**主键**：`PRIMARY KEY (id)`

---

### 2.3 Goods（商品表）

| 字段名 | 类型 | 可为空 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| id | INT | NOT NULL | AUTO_INCREMENT | 主键，商品唯一标识 |
| title | VARCHAR(100) | NOT NULL | — | 商品标题 |
| description | TEXT | NOT NULL | — | 商品描述 |
| price | DECIMAL(10,2) | NOT NULL | — | 商品价格 |
| images | JSON | NOT NULL | — | 商品图片路径列表 JSON 数组 |
| status | ENUM('PendingReview','Rejected','Approved','Reserved','Sold','Removed') | NOT NULL | 'PendingReview' | 商品状态 |
| version | INT | NOT NULL | 0 | 乐观锁版本号，用于并发控制 |
| user_id | INT | NOT NULL | — | 发布者 ID，外键关联 User(id) |
| category_id | INT | NOT NULL | — | 分类 ID，外键关联 Category(id) |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 发布时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**主键**：`PRIMARY KEY (id)`

**外键**：
- `FOREIGN KEY (user_id) REFERENCES User(id)`
- `FOREIGN KEY (category_id) REFERENCES Category(id)`

**索引**：
- `INDEX idx_user_id (user_id)`
- `INDEX idx_category_id (category_id)`
- `INDEX idx_status (status)`
- `INDEX idx_status_created (status, created_at)` — 商品列表页按状态和发布时间排序
- `FULLTEXT INDEX ft_title_description (title, description)` — 支持关键词搜索

---

### 2.4 Favorite（收藏表）

| 字段名 | 类型 | 可为空 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| id | INT | NOT NULL | AUTO_INCREMENT | 主键，收藏记录唯一标识 |
| user_id | INT | NOT NULL | — | 用户 ID，外键关联 User(id) |
| goods_id | INT | NOT NULL | — | 商品 ID，外键关联 Goods(id) |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 收藏时间 |

**主键**：`PRIMARY KEY (id)`

**外键**：
- `FOREIGN KEY (user_id) REFERENCES User(id)`
- `FOREIGN KEY (goods_id) REFERENCES Goods(id)`

**唯一约束**：`UNIQUE KEY uk_user_goods (user_id, goods_id)` — 防止重复收藏

**索引**：
- `INDEX idx_user_id (user_id)`
- `INDEX idx_goods_id (goods_id)`

---

### 2.5 Order（订单表）

| 字段名 | 类型 | 可为空 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| id | INT | NOT NULL | AUTO_INCREMENT | 主键，订单唯一标识 |
| buyer_id | INT | NOT NULL | — | 买家 ID，外键关联 User(id) |
| seller_id | INT | NOT NULL | — | 卖家 ID，外键关联 User(id)，直接保存以保证历史一致性 |
| goods_id | INT | NOT NULL | — | 商品 ID，外键关联 Goods(id) |
| status | ENUM('Pending','Confirmed','Completed','Cancelled') | NOT NULL | 'Pending' | 订单状态 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**主键**：`PRIMARY KEY (id)`

**外键**：
- `FOREIGN KEY (buyer_id) REFERENCES User(id)`
- `FOREIGN KEY (seller_id) REFERENCES User(id)`
- `FOREIGN KEY (goods_id) REFERENCES Goods(id)`

**索引**：
- `INDEX idx_buyer_id (buyer_id)`
- `INDEX idx_seller_id (seller_id)`
- `INDEX idx_goods_id (goods_id)`
- `INDEX idx_status (status)`
- `INDEX idx_buyer_status (buyer_id, status)` — 买家订单列表查询
- `INDEX idx_seller_status (seller_id, status)` — 卖家订单列表查询

---

### 2.6 ReviewRecord（审核记录表）

| 字段名 | 类型 | 可为空 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| id | INT | NOT NULL | AUTO_INCREMENT | 主键，审核记录唯一标识 |
| goods_id | INT | NOT NULL | — | 商品 ID，外键关联 Goods(id) |
| admin_id | INT | NOT NULL | — | 审核人 ID，外键关联 User(id) |
| action | ENUM('approved','rejected') | NOT NULL | — | 审核动作 |
| reason | VARCHAR(500) | YES | NULL | 驳回理由（审核通过时可为空） |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 审核时间 |

**主键**：`PRIMARY KEY (id)`

**外键**：
- `FOREIGN KEY (goods_id) REFERENCES Goods(id)`
- `FOREIGN KEY (admin_id) REFERENCES User(id)`

**索引**：
- `INDEX idx_goods_id (goods_id)`
- `INDEX idx_admin_id (admin_id)`
- `INDEX idx_created_at (created_at)`

---

## 3. 状态字段设计

### 3.1 商品状态 Goods.status

| 枚举值 | 含义 | 说明 |
|--------|------|------|
| PendingReview | 待审核 | 用户提交后等待管理员审核 |
| Rejected | 审核驳回 | 审核失败，用户可修改后重新提交 |
| Approved | 已上架 | 审核通过，前台可见，可被下单 |
| Reserved | 已预订 | 已有订单关联，暂不可再被下单 |
| Sold | 已售出 | 交易完成，商品已售出 |
| Removed | 已下架 | 用户主动下架或管理员强制下架 |

### 3.2 订单状态 Order.status

| 枚举值 | 含义 | 说明 |
|--------|------|------|
| Pending | 待确认 | 买家创建订单，等待卖家确认 |
| Confirmed | 已确认 | 卖家确认交易，等待买家确认收货 |
| Completed | 已完成 | 买家确认收货，交易完成 |
| Cancelled | 已取消 | 订单被取消 |

---

## 4. 索引设计总结

| 表名 | 索引 | 类型 | 作用 |
|------|------|------|------|
| User | uk_email | 唯一 | 登录时通过邮箱查询 |
| User | idx_role | 普通 | 管理员筛选 |
| Goods | idx_user_id | 普通 | 查询用户发布的商品 |
| Goods | idx_category_id | 普通 | 按分类筛选 |
| Goods | idx_status | 普通 | 按状态筛选待审核商品 |
| Goods | idx_status_created | 复合 | 商品列表页排序 |
| Goods | ft_title_description | 全文 | 关键词搜索 |
| Favorite | uk_user_goods | 唯一 | 防止重复收藏 |
| Favorite | idx_user_id | 普通 | 查询用户收藏列表 |
| Favorite | idx_goods_id | 普通 | 查询商品被收藏次数 |
| Order | idx_buyer_id | 普通 | 买家订单查询 |
| Order | idx_seller_id | 普通 | 卖家订单查询 |
| Order | idx_goods_id | 普通 | 商品关联订单查询 |
| Order | idx_buyer_status | 复合 | 买家按状态筛选订单 |
| Order | idx_seller_status | 复合 | 卖家按状态筛选订单 |
| ReviewRecord | idx_goods_id | 普通 | 按商品查询审核记录 |
| ReviewRecord | idx_admin_id | 普通 | 按管理员查询审核记录 |
| ReviewRecord | idx_created_at | 普通 | 按时间排序 |

---

## 5. 约束设计

| 约束 | 表 | 说明 |
|------|-----|------|
| PRIMARY KEY | 所有表 | id 自增主键 |
| UNIQUE | User.email | 邮箱唯一 |
| UNIQUE | Favorite(user_id, goods_id) | 同一用户对同一商品只能收藏一次 |
| FOREIGN KEY | Goods.user_id → User.id | 商品发布者 |
| FOREIGN KEY | Goods.category_id → Category.id | 商品分类 |
| FOREIGN KEY | Favorite.user_id → User.id | 收藏用户 |
| FOREIGN KEY | Favorite.goods_id → Goods.id | 收藏商品 |
| FOREIGN KEY | Order.buyer_id → User.id | 订单买家 |
| FOREIGN KEY | Order.seller_id → User.id | 订单卖家 |
| FOREIGN KEY | Order.goods_id → Goods.id | 订单商品 |
| FOREIGN KEY | ReviewRecord.goods_id → Goods.id | 审核商品 |
| FOREIGN KEY | ReviewRecord.admin_id → User.id | 审核管理员 |

---

## 6. 并发控制设计

### 6.1 问题场景

用户 A 和用户 B 同时购买同一商品。在无并发控制的情况下，两个请求可能同时检查到商品状态为 Approved，导致同一商品被重复下单。

### 6.2 乐观锁机制

在 Goods 表中引入 `version` 字段，初始值为 0，每次更新时递增。

创建订单时，后端在数据库事务中执行以下操作：

```sql
START TRANSACTION;

-- 检查商品状态和版本号
SELECT status, version
FROM goods
WHERE id = :goodsId
  AND status = 'Approved'
  AND version = :goodsVersion
FOR UPDATE;

-- 若未找到匹配记录，则回滚并返回冲突
-- 若找到匹配记录，则原子更新状态和版本号
UPDATE goods
SET status = 'Reserved',
    version = version + 1
WHERE id = :goodsId
  AND version = :goodsVersion
  AND status = 'Approved';

-- 检查受影响行数
-- 若 affectedRows = 0，则回滚并返回 409 冲突
-- 若 affectedRows = 1，则继续

-- 创建订单
INSERT INTO orders (buyer_id, seller_id, goods_id, status)
VALUES (:buyerId, :sellerId, :goodsId, 'Pending');

COMMIT;
```

### 6.3 乐观锁 VS 悲观锁

| 对比项 | 乐观锁（本方案） | 悲观锁（SELECT ... FOR UPDATE） |
|--------|-----------------|-------------------------------|
| 原理 | 版本号校验，更新时检查 | 直接锁定行，其他请求等待 |
| 并发性能 | 高，读操作不阻塞 | 低，写操作阻塞读 |
| 适用场景 | 读多写少，冲突概率低 | 写多，冲突概率高 |
| 实现复杂度 | 低，仅需 version 字段 | 低，依赖数据库锁 |

本方案采用乐观锁，原因：二手交易平台中，同一商品被多人同时抢购的概率较低，乐观锁在大多数情况下无需等待，性能更优。

### 6.4 状态一致性保证

订单状态与商品状态的联动通过数据库事务保证原子性：

| 操作 | 事务内容 |
|------|---------|
| 创建订单 | 更新 goods.status = Reserved + 插入 order(status=Pending) |
| 取消订单 | 更新 goods.status = Approved + 更新 order(status=Cancelled) |
| 卖家确认交易 | 更新 order(status=Confirmed) |
| 买家确认收货 | 更新 goods.status = Sold + 更新 order(status=Completed) |

所有状态变更操作均在同一个数据库事务中执行，确保不会出现部分更新导致的数据不一致。