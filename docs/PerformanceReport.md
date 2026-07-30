# CampusTrade 性能设计报告

## 1. 系统性能设计目标

| 目标 | 说明 |
|---|---|
| **低延迟** | 核心 API（商品列表、商品详情、下单）响应时间控制在 200ms 以内（单机 MySQL，非缓存场景） |
| **高并发下单安全** | 同一商品多用户同时购买时，保证**恰好一个**成功，其余收到明确冲突提示，不出现超卖 |
| **查询效率** | 商品列表和订单列表通过索引覆盖，避免全表扫描 |
| **无单点瓶颈** | 后端无状态设计，可水平扩展；数据库由索引和乐观锁保护写入热点 |

## 2. 数据库索引设计

### goods 表

| 索引名 | 列 | 目的 |
|---|---|---|
| `PRIMARY` | `id` | 主键查找 |
| `idx_goods_user_id` | `user_id` | 我的商品列表（`WHERE user_id = ?`） |
| `idx_goods_category_id` | `category_id` | 按分类筛选商品 |
| `idx_goods_status` | `status` | 按状态筛选（首页仅查 `Approved`） |
| `idx_goods_status_created` | `status`, `created_at` | **复合索引**：首页列表查询（`WHERE status='Approved' ORDER BY created_at DESC`），覆盖排序字段，避免 filesort |

### orders 表

| 索引名 | 列 | 目的 |
|---|---|---|
| `PRIMARY` | `id` | 主键查找 |
| `idx_orders_buyer_id` | `buyer_id` | 买家订单列表 |
| `idx_orders_seller_id` | `seller_id` | 卖家订单列表 |
| `idx_orders_goods_id` | `goods_id` | 按商品查订单 |
| `idx_orders_status` | `status` | 按状态筛选 |
| `idx_orders_buyer_status` | `buyer_id`, `status` | **复合索引**：买家视角「我的订单 + 状态筛选」 |
| `idx_orders_seller_status` | `seller_id`, `status` | **复合索引**：卖家视角「我的订单 + 状态筛选」 |

### favorites 表

| 索引名 | 列 | 目的 |
|---|---|---|
| `PRIMARY` | `id` | 主键查找 |
| `uk_favorites_user_goods` | `user_id`, `goods_id` | **唯一约束**：防止重复收藏 |
| `idx_favorites_user_id` | `user_id` | 我的收藏列表 |
| `idx_favorites_goods_id` | `goods_id` | 商品被收藏次数统计 |

### review_records 表

| 索引名 | 列 | 目的 |
|---|---|---|
| `idx_review_records_goods_id` | `goods_id` | 按商品查审核记录 |
| `idx_review_records_admin_id` | `admin_id` | 管理员查自己的审核记录 |
| `idx_review_records_created_at` | `created_at` | 审核记录按时间排序 |

## 3. 商品查询优化

商品列表是系统最高频的查询接口，对应 `GoodsService.list()`：

```typescript
// GoodsService.list 核心逻辑
const [items, total] = await this.goodsModel.findAndCount({
  where: {
    status: GoodsStatus.APPROVED,
    ...(categoryId && { categoryId }),
    ...(keyword && { title: Like(`%${keyword}%`) }),
  },
  relations: ['user', 'category'],
  order: { createdAt: 'DESC' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

### 执行计划分析

- **无关键字搜索**：`WHERE status='Approved' ORDER BY createdAt DESC` → 命中 `idx_goods_status_created` 复合索引，索引已包含排序字段，无需额外 filesort。
- **按分类筛选**：`WHERE status='Approved' AND categoryId=? ORDER BY createdAt DESC` → MySQL 可能选择 `idx_goods_status_created` 做索引过滤，或 `idx_goods_category_id` 后回表。数据量较大时可考虑追加 `(status, category_id, created_at)` 复合索引。
- **关键字搜索**：`WHERE title LIKE '%keyword%'` → 无法使用索引，必须全表扫描。这是前端模糊搜索的通病。若后续规模扩大，建议引入 Elasticsearch 或 MySQL 全文索引。

### 分页

采用 `skip/take`（即 `LIMIT ? OFFSET ?`）实现物理分页，后端返回 `{ total, page, pageSize, items }`，前端根据 `total` 计算总页数。对于深分页场景（page >> 1），可考虑游标分页优化。

## 4. 订单查询优化

订单列表对应 `OrderService.getOrders()`：

```typescript
const [items, total] = await this.orderModel.findAndCount({
  where: [
    { buyerId: userId },
    { sellerId: userId },
  ],
  relations: ['goods', 'buyer', 'seller'],
  order: { createdAt: 'DESC' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

### 说明

- 查询条件是 `buyerId = ? OR sellerId = ?`，TypeORM 的 `where` 数组被翻译为 `WHERE (buyer_id = ?) OR (seller_id = ?)`。
- 该查询无法直接利用单独的 `idx_orders_buyer_id` 或 `idx_orders_seller_id` 索引做索引合并优化。MySQL 在 `OR` 条件下通常选择全表扫描或索引合并（index merge）。
- 当前表数据量小时性能可接受。若数据量增长，可考虑拆分查询：
  - 查询两遍（`WHERE buyer_id = ?` UNION `WHERE seller_id = ?`），各自走索引后再合并。
  - 或在应用层维护两份数据视图。

## 5. 并发购买场景

### 场景描述

用户 A 和用户 B 同时查看同一件商品，商品处于 `Approved` 状态，`version = 3`。两人几乎同时点击"购买"按钮。

### 请求流程

```
用户 A                             用户 B
  |                                  |
  | POST /api/orders                 | POST /api/orders
  | { goodsId: 1, goodsVersion: 3 }  | { goodsId: 1, goodsVersion: 3 }
  |                                  |
  v                                  v
OrderService.createOrder(买家A, 1, 3)  OrderService.createOrder(买家B, 1, 3)
  |                                  |
  | BEGIN TX                         | BEGIN TX
  | SELECT * FROM goods WHERE id=1   | SELECT * FROM goods WHERE id=1
  | → version=3, status=Approved     | → version=3, status=Approved
  | (校验通过)                        | (校验通过)
  |                                  |
  | UPDATE goods                     | UPDATE goods
  | SET status='Reserved',           | SET status='Reserved',
  |     version=version+1            |     version=version+1
  | WHERE id=1                       | WHERE id=1
  |   AND version=3                  |   AND version=3
  |   AND status='Approved'          |   AND status='Approved'
  |                                  |
  | affectedRows = 1  ← 成功         | affectedRows = 0  ← 失败
  | INSERT INTO orders ...           | ROLLBACK → 返回 409
  | COMMIT → 返回 201                |
```

### 最终结果

| 用户 | HTTP 状态码 | 结果 |
|---|---|---|
| 用户 A | 201 | 下单成功，商品变为 `Reserved` |
| 用户 B | 409 | 收到 `"商品已被其他用户购买"` 错误 |

## 6. 乐观锁实现原理

乐观锁的核心思想是：**假设冲突很少发生，仅在数据提交时验证版本**，而非在读取时加锁。

### 实现代码

```typescript
// OrderService.createOrder — 核心片段
const updateResult = await queryRunner.manager
  .createQueryBuilder()
  .update(GoodsEntity)
  .set({
    status: GoodsStatus.RESERVED,
    version: () => 'version + 1',
  })
  .where('id = :id AND version = :version AND status = :status', {
    id: goodsId,
    version: goodsVersion,
    status: GoodsStatus.APPROVED,
  })
  .execute();

if (updateResult.affected === 0) {
  throw { status: 409, message: '商品已被其他用户购买' };
}
```

### 关键设计

| 要素 | 说明 |
|---|---|
| **版本字段** | `goods.version`，初始为 0，每次更新 +1 |
| **条件更新** | `UPDATE ... WHERE id=? AND version=? AND status=?`，只有版本和状态完全匹配时才会更新成功 |
| **原子性** | `UPDATE` 是 MySQL 行级原子操作，InnoDB 在行锁保护下执行，两个并发 UPDATE 必然一胜一败 |
| **状态校验** | `WHERE status='Approved'` 确保商品确实处于可购买状态，避免已售商品被重复下单 |
| **事务包裹** | 整个操作在 `QueryRunner` 事务中执行，更新失败时 ROLLBACK 不会产生脏数据 |

### 为什么不用悲观锁？

| 方案 | 对比 |
|---|---|
| **悲观锁（SELECT ... FOR UPDATE）** | 行锁会阻塞其他事务直到提交，高并发下容易形成锁等待和死锁，降低吞吐量 |
| **乐观锁（version 条件更新）** | 无锁等待，冲突时立即返回 409，适合读多写少的校园二手交易场景 |

## 7. 超卖问题解决方案

### 问题定义

超卖指同一商品被多个用户同时成功购买，导致库存（或商品数量）变为负数，或一件商品被卖给多人。

### 方案：乐观锁 + 事务

CampusTrade 采用乐观锁 + 数据库事务的组合方案，确保在并发下单时不会出现超卖。

#### 第一道防线：版本号校验

```typescript
// 内存校验（非必须，但可提前拦截无效请求）
if (goods.version !== goodsVersion) {
  throw { status: 409, message: '商品已被其他用户购买' };
}
```

#### 第二道防线：原子 UPDATE

```sql
UPDATE goods
SET status = 'Reserved', version = version + 1
WHERE id = ?
  AND version = ?
  AND status = 'Approved';
```

- 这是整个方案的核心。InnoDB 的行锁保证同时只有一个事务能成功执行该 UPDATE。
- `affectedRows` 为 0 时说明版本或状态已变更，直接回滚事务并返回 409。

#### 第三道防线：事务回滚

```typescript
try {
  // ... 校验和更新逻辑
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

- 如果更新失败，事务回滚，不会产生任何脏数据。
- 如果更新成功但后续 INSERT 订单失败，事务也会回滚，商品状态和版本恢复到更新前。

#### 极端情况分析

| 场景 | 结果 |
|---|---|
| 两人同时发起购买，版本相同 | 一个 UPDATE 成功（affectedRows=1），一个失败（affectedRows=0） |
| 同一用户重复点击购买 | 第一次成功，商品状态变为 `Reserved`；第二次 UPDATE 的 `WHERE status='Approved'` 不匹配，返回 409 |
| 购买成功后卖家又上架 | 商品状态变为 `Reserved` 后，卖家无法操作上架（状态机控制），超卖不会发生 |
| 订单取消后商品恢复 | `cancelOrder` 将商品状态改回 `Approved`，`version` 不变，新买家可正常购买 |

### 并发测试验证

`concurrency.test.ts` 中的测试覆盖了该场景：

```typescript
it('should allow only one user to purchase with same version', async () => {
  const [res1, res2] = await Promise.all([
    app.httpRequest().post('/api/orders').set('Authorization', `Bearer ${userToken1}`).send({ goodsId, goodsVersion }),
    app.httpRequest().post('/api/orders').set('Authorization', `Bearer ${userToken2}`).send({ goodsId, goodsVersion }),
  ]);

  const statuses = [res1.status, res2.status];
  const successCount = statuses.filter((s) => s === 201).length;
  const conflictCount = statuses.filter((s) => s === 409).length;

  expect(successCount).toBe(1);  // 恰好一人成功
  expect(conflictCount).toBe(1); // 恰好一人冲突
});
```

该测试通过 `Promise.all` 模拟两个用户同时下单，断言**恰好一个成功、一个收到 409 冲突**，从端到端验证了超卖问题已被解决。