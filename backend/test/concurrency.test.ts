import { createApp, close } from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';

let app: any;
let userToken1: string;
let userToken2: string;

beforeAll(async () => {
  app = await createApp<Framework>();

  await app.httpRequest()
    .post('/api/auth/register')
    .send({ username: 'con-user1', email: 'con-user1@test.com', password: '123456' });

  await app.httpRequest()
    .post('/api/auth/register')
    .send({ username: 'con-user2', email: 'con-user2@test.com', password: '123456' });

  const r1 = await app.httpRequest()
    .post('/api/auth/login')
    .send({ email: 'con-user1@test.com', password: '123456' });

  const r2 = await app.httpRequest()
    .post('/api/auth/login')
    .send({ email: 'con-user2@test.com', password: '123456' });

  userToken1 = r1.body.token;
  userToken2 = r2.body.token;
});

afterAll(async () => {
  await close(app);
});

describe('Concurrent Purchase', () => {
  let goodsId: number;
  let goodsVersion: number;

  it('should create a goods and approve it', async () => {
    const adminEmail = 'con-admin@test.com';
    await app.httpRequest()
      .post('/api/auth/register')
      .send({ username: 'con-admin', email: adminEmail, password: 'admin123' });

    const adminRes = await app.httpRequest()
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'admin123' });

    const adminToken = adminRes.body.token;

    const createRes = await app.httpRequest()
      .post('/api/goods')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({ title: '并发测试商品', description: '测试并发购买', price: 50, categoryId: 1, images: [] })
      .expect(201);

    goodsId = createRes.body.id;
    goodsVersion = createRes.body.version;

    await app.httpRequest()
      .put(`/api/admin/goods/${goodsId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approved' })
      .expect(200);
  });

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
});