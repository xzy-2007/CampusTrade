import { createApp, close } from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';

let app: any;
let userToken: string;
let adminToken: string;
let goodsId: number;
let goodsVersion: number;
let orderId: number;

beforeAll(async () => {
  app = await createApp<Framework>();
});

afterAll(async () => {
  await close(app);
});

describe('Auth', () => {
  it('POST /api/auth/register - should register a new user', async () => {
    const res = await app.httpRequest()
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: '123456' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe('testuser');
    expect(res.body.email).toBe('test@example.com');
  });

  it('POST /api/auth/register - should return 409 for duplicate email', async () => {
    await app.httpRequest()
      .post('/api/auth/register')
      .send({ username: 'testuser2', email: 'test@example.com', password: '123456' })
      .expect(409);
  });

  it('POST /api/auth/register - should register admin user', async () => {
    const res = await app.httpRequest()
      .post('/api/auth/register')
      .send({ username: 'admin', email: 'admin@example.com', password: 'admin123' })
      .expect(201);

  });

  it('POST /api/auth/login - should login successfully', async () => {
    const res = await app.httpRequest()
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '123456' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('test@example.com');
    userToken = res.body.token;
  });

  it('POST /api/auth/login - should login admin', async () => {
    const res = await app.httpRequest()
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);

    adminToken = res.body.token;
  });

  it('POST /api/auth/login - should return 401 for wrong password', async () => {
    await app.httpRequest()
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(401);
  });

  it('GET /api/auth/me - should return current user info', async () => {
    const res = await app.httpRequest()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('test@example.com');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/auth/me - should return 401 without token', async () => {
    await app.httpRequest()
      .get('/api/auth/me')
      .expect(401);
  });
});

describe('User', () => {
  it('GET /api/users/profile - should return profile', async () => {
    const res = await app.httpRequest()
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('username');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('PUT /api/users/profile - should update profile', async () => {
    const res = await app.httpRequest()
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'updateduser', phone: '13800138000' })
      .expect(200);

    expect(res.body.username).toBe('updateduser');
    expect(res.body.phone).toBe('13800138000');
  });

  it('GET /api/users/goods - should return empty list', async () => {
    const res = await app.httpRequest()
      .get('/api/users/goods')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('items');
  });

  it('GET /api/users/favorites - should return empty list', async () => {
    const res = await app.httpRequest()
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('items');
  });
});

describe('Category', () => {
  it('GET /api/categories - should return category list', async () => {
    const res = await app.httpRequest()
      .get('/api/categories')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Goods', () => {
  it('POST /api/goods - should create goods', async () => {
    const res = await app.httpRequest()
      .post('/api/goods')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: '测试商品',
        description: '这是一个测试商品描述',
        price: 99.99,
        categoryId: 1,
        images: ['/images/test.jpg'],
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PendingReview');
    goodsId = res.body.id;
    goodsVersion = res.body.version;
  });

  it('GET /api/goods - should return empty list (no approved goods)', async () => {
    const res = await app.httpRequest()
      .get('/api/goods')
      .expect(200);

    expect(res.body.total).toBe(0);
  });

  it('GET /api/goods/:id - owner can see own goods', async () => {
    const res = await app.httpRequest()
      .get(`/api/goods/${goodsId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.id).toBe(goodsId);
  });

  it('GET /api/goods/:id - guest cannot see pending goods', async () => {
    await app.httpRequest()
      .get(`/api/goods/${goodsId}`)
      .expect(404);
  });
});

describe('Admin - Review', () => {
  it('GET /api/admin/goods - should return pending goods', async () => {
    const res = await app.httpRequest()
      .get('/api/admin/goods')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('PUT /api/admin/goods/:id/review - should approve goods', async () => {
    const res = await app.httpRequest()
      .put(`/api/admin/goods/${goodsId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approved' })
      .expect(200);

    expect(res.body.status).toBe('Approved');
  });

  it('GET /api/goods - should return approved goods', async () => {
    const res = await app.httpRequest()
      .get('/api/goods')
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].id).toBe(goodsId);
  });

  it('GET /api/admin/review-records - should return review records', async () => {
    const res = await app.httpRequest()
      .get('/api/admin/review-records')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

describe('Favorite', () => {
  it('POST /api/favorites - should add favorite', async () => {
    const res = await app.httpRequest()
      .post('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ goodsId })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.goodsId).toBe(goodsId);
  });

  it('POST /api/favorites - should return 409 for duplicate', async () => {
    await app.httpRequest()
      .post('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ goodsId })
      .expect(409);
  });

  it('GET /api/favorites - should return favorites list', async () => {
    const res = await app.httpRequest()
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /api/favorites/:goodsId - should remove favorite', async () => {
    await app.httpRequest()
      .del(`/api/favorites/${goodsId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });

  it('GET /api/favorites - should be empty after removal', async () => {
    const res = await app.httpRequest()
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.total).toBe(0);
  });
});

describe('Order', () => {
  it('POST /api/orders - should create order', async () => {
    const res = await app.httpRequest()
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ goodsId, goodsVersion })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('Pending');
    orderId = res.body.id;
  });

  it('POST /api/orders - should return 409 for same goods', async () => {
    await app.httpRequest()
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ goodsId, goodsVersion })
      .expect(409);
  });

  it('GET /api/orders - should return orders list', async () => {
    const res = await app.httpRequest()
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/orders/:id - should return order detail', async () => {
    const res = await app.httpRequest()
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.id).toBe(orderId);
    expect(res.body.status).toBe('Pending');
  });

  it('PUT /api/orders/:id/seller-confirm - seller should confirm', async () => {
    const res = await app.httpRequest()
      .put(`/api/orders/${orderId}/seller-confirm`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.status).toBe('Confirmed');
  });

  it('PUT /api/orders/:id/buyer-confirm - buyer should confirm receipt', async () => {
    const res = await app.httpRequest()
      .put(`/api/orders/${orderId}/buyer-confirm`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.status).toBe('Completed');
    expect(res.body.goodsStatus).toBe('Sold');
  });
});

describe('Admin - Force Remove', () => {
  it('PUT /api/admin/goods/:id/force-remove - should force remove goods', async () => {
    const res = await app.httpRequest()
      .put(`/api/admin/goods/${goodsId}/force-remove`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBe('Removed');
  });
});

describe('Goods - Resubmit', () => {
  let rejectedGoodsId: number;

  it('should setup: create and reject a goods', async () => {
    const createRes = await app.httpRequest()
      .post('/api/goods')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '驳回测试', description: '将被驳回', price: 10, categoryId: 1, images: [] })
      .expect(201);

    rejectedGoodsId = createRes.body.id;

    await app.httpRequest()
      .put(`/api/admin/goods/${rejectedGoodsId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'rejected', reason: '图片不符合要求' })
      .expect(200);
  });

  it('PUT /api/goods/:id/resubmit - should resubmit rejected goods', async () => {
    const res = await app.httpRequest()
      .put(`/api/goods/${rejectedGoodsId}/resubmit`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '驳回测试-修改', description: '已修改', price: 15, categoryId: 1, images: [] })
      .expect(200);

    expect(res.body.status).toBe('PendingReview');
  });

  it('PUT /api/goods/:id/resubmit - should fail for non-rejected goods', async () => {
    await app.httpRequest()
      .put(`/api/goods/${goodsId}/resubmit`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '测试', description: '测试', price: 10, categoryId: 1, images: [] })
      .expect(400);
  });
});