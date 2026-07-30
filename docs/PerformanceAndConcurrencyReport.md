# 性能与并发控制报告

## 1. 乐观锁设计

### 1.1 设计动机

校园二手交易平台的核心交易场景是"一件商品卖给一个人"。当多个用户同时购买同一件商品时，必须保证**恰好一个**用户成功下单，其余用户收到明确的冲突提示，不能出现超卖（同一商品被多次下单）。

### 1.2 实现方式

在 `GoodsEntity` 中引入 `version` 字段：

```typescript
// GoodsEntity
@Column({ type: 'int', default: 0 })
version: number;
```

每次下单操作通过原子 `UPDATE` 条件更新来实现乐观锁，核心代码位于 `OrderService.createOrder`：

```typescript
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

### 1.3 关键点

| 要素 | 说明 |
|---|---|
| 版本号由数据库递增 | `version: () => 'version + 1'` 由 MySQL 执行，非应用层计算，避免竞态 |
| 条件匹配 | `WHERE version = ? AND status = 'Approved'` 确保版本和状态同时匹配才更新 |
| 前端传入 | 商品详情接口返回 `version`，下单时由前端回传，形成闭合校验 |
| 事务保护 | 整个操作在 `QueryRunner` 事务中执行，任一步骤失败均回滚 |

## 2. 秒杀场景模拟

### 2.1 场景设定

| 参数 | 值 |
|---|---|
| 商品 | 1 件，状态 `Approved`，`version = 0` |
| 买家 | 2 人（user1、user2） |
| 并发方式 | `Promise.all` 同时发起两个请求 |
| 预期结果 | 1 人 201 成功，1 人 409 冲突 |

### 2.2 请求流程时序

```
时间线 →
 user1 POST /api/orders          user2 POST /api/orders
 { goodsId: 1, version: 0 }       { goodsId: 1, version: 0 }
       │                                 │
       │ BEGIN TX                        │ BEGIN TX
       │ SELECT goods WHERE id=1         │ SELECT goods WHERE id=1
       │ → version=0, Approved           │ → version=0, Approved
       │ (校验通过)                       │ (校验通过)
       │                                 │
       │ UPDATE goods                     │ UPDATE goods
       │ SET version=1, Reserved          │ SET version=1, Reserved
       │ WHERE id=1 AND version=0         │ WHERE id=1 AND version=0
       │ AND status='Approved'            │ AND status='Approved'
       │                                 │
       │ ★ affectedRows = 1  ← 成功      │ ✗ affectedRows = 0  ← 失败
       │ INSERT INTO orders               │ ROLLBACK
       │ COMMIT                           │ 返回 409
       │ 返回 201                         │
```

### 2.3 关键行为

- `UPDATE` 是 MySQL InnoDB 的行级原子操作，两个并发 `UPDATE` 必然顺序执行
- 第一个 `UPDATE` 成功后将 `version` 从 0 变为 1，`status` 从 `Approved` 变为 `Reserved`
- 第二个 `UPDATE` 的 `WHERE version=0 AND status='Approved'` 不再匹配，`affectedRows = 0`
- 第二个事务回滚，用户收到 409 冲突响应

## 3. 并发购买测试

### 3.1 测试代码

`test/concurrency.test.ts` 中的测试用例完整模拟了秒杀场景：

```typescript
it('should allow only one user to purchase with same version', async () => {
  const [res1, res2] = await Promise.all([
    app.httpRequest()
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({ goodsId, goodsVersion }),
    app.httpRequest()
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken2}`)
      .send({ goodsId, goodsVersion }),
  ]);

  const statuses = [res1.status, res2.status];
  const successCount = statuses.filter((s) => s === 201).length;
  const conflictCount = statuses.filter((s) => s === 409).length;

  expect(successCount).toBe(1);
  expect(conflictCount).toBe(1);
});
```

### 3.2 测试前置

| 步骤 | 说明 |
|---|---|
| 注册 con-user1 | 买家 A |
| 注册 con-user2 | 买家 B |
| 注册 con-admin | 管理员 |
| user1 发布商品 | 商品状态 `PendingReview` |
| admin 审核通过 | 商品状态 `Approved`，`version = 0` |

### 3.3 测试结果断言

| 断言 | 含义 |
|---|---|
| `successCount === 1` | 恰好一个用户成功下单 |
| `conflictCount === 1` | 恰好一个用户收到冲突 |

### 3.4 测试运行

```bash
cd backend
npm run test
```

测试框架使用 Jest 29 + `@midwayjs/mock`，自动启动完整的 Midway 应用容器进行测试。

## 4. 冲突处理机制

### 4.1 冲突检测链路

系统采用三层防护机制确保并发安全：

```
第一层：内存校验
  └─ if (goods.version !== goodsVersion) → 409
  └─ if (goods.status !== GoodsStatus.APPROVED) → 400

第二层：原子 UPDATE（核心）
  └─ UPDATE goods SET version=version+1, status='Reserved'
     WHERE id=? AND version=? AND status='Approved'
  └─ if (affectedRows === 0) → 409

第三层：事务回滚
  └─ try { commitTransaction() } catch { rollbackTransaction() }
```

### 4.2 各层作用

| 层次 | 作用 | 能否独立防超卖 |
|---|---|---|
| 内存校验 | 提前拦截版本不一致的请求，减少无效数据库写入 | 不能（存在 TOCTOU 问题） |
| 原子 UPDATE | 数据库层面的原子条件更新，是防超卖的核心保障 | 能 |
| 事务回滚 | 确保更新失败或后续操作失败时数据一致 | 辅助 |

### 4.3 HTTP 响应映射

| 状态码 | 场景 | 响应体 |
|---|---|---|
| `201` | 下单成功 | `{ id, status: 'Pending', goodsId, createdAt }` |
| `400` | 不能购买自己的商品 | `{ message: '不能购买自己发布的商品' }` |
| `400` | 商品状态不可购买 | `{ message: '商品不可购买' }` |
| `404` | 商品不存在 | `{ message: '商品不存在' }` |
| `409` | 版本冲突（已被购买） | `{ message: '商品已被其他用户购买' }` |
| `409` | 重复下单同一商品 | `{ message: '商品已被其他用户购买' }` |

### 4.4 极端情况覆盖

| 场景 | 防护结果 |
|---|---|
| 两人同时抢购，版本相同 | 原子 UPDATE 保证一胜一负 |
| 同一用户重复点击 | 第一次成功后 status 变为 `Reserved`，第二次 `WHERE status='Approved'` 不匹配 |
| 用户 A 购买后取消，用户 B 同时购买 | 取消操作将 status 恢复为 `Approved`，version 不变，新买家可正常购买 |
| 网络超时导致前端重试 | 第二次请求携带的 `version` 落后于数据库中的版本，内存校验阶段即返回 409 |
| 管理员在用户下单时强制下架 | 管理员操作将 status 改为 `Removed`，下单的 `WHERE status='Approved'` 不匹配，返回 409 |