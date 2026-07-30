import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entity/UserEntity';
import { CategoryEntity } from '../entity/CategoryEntity';
import { GoodsEntity } from '../entity/GoodsEntity';
import { FavoriteEntity } from '../entity/FavoriteEntity';
import { ReviewRecordEntity } from '../entity/ReviewRecordEntity';
import { OrderEntity } from '../entity/OrderEntity';
import { UserRole } from '../entity/UserRole';
import { GoodsStatus } from '../entity/GoodsStatus';
import { OrderStatus } from '../entity/OrderStatus';
import { ReviewAction } from '../entity/ReviewAction';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'campus_trade',
  charset: 'utf8mb4',
  timezone: '+08:00',
  synchronize: true,
  entities: [
    UserEntity,
    CategoryEntity,
    GoodsEntity,
    FavoriteEntity,
    ReviewRecordEntity,
    OrderEntity,
  ],
});

async function seed() {
  console.log('[Seed] 连接数据库...');
  await dataSource.initialize();
  console.log('[Seed] 数据库连接成功');

  const manager = dataSource.manager;

  const existingCategories = await manager.count(CategoryEntity);
  if (existingCategories > 0) {
    console.log('[Seed] 种子数据已存在，跳过');
    await dataSource.destroy();
    return;
  }

  console.log('[Seed] 开始插入种子数据...');

  // ============================================================
  // 1. 分类
  // ============================================================
  console.log('[Seed] 插入分类...');
  const categories = await manager.save(CategoryEntity, [
    { name: '数码电子', description: '手机、电脑、数码配件等' },
    { name: '图书教材', description: '教材、教辅、课外读物等' },
    { name: '生活用品', description: '宿舍用品、日用品等' },
    { name: '运动装备', description: '运动器材、健身用品等' },
  ]);

  const [catDigital, catBooks, catDaily, catSports] = categories;

  // ============================================================
  // 2. 用户
  // ============================================================
  console.log('[Seed] 插入用户...');
  const passwordHash = await bcrypt.hash('123456', 10);

  const users = await manager.save(UserEntity, [
    {
      username: 'student1',
      email: 'student1@test.com',
      passwordHash,
      role: UserRole.USER,
      isActive: 1,
    },
    {
      username: 'student2',
      email: 'student2@test.com',
      passwordHash,
      role: UserRole.USER,
      isActive: 1,
    },
    {
      username: 'admin',
      email: 'admin@test.com',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: 1,
    },
  ]);

  const [student1, student2, admin] = users;

  // ============================================================
  // 3. 商品
  // ============================================================
  console.log('[Seed] 插入商品...');

  // student1 的商品
  const goods1 = await manager.save(GoodsEntity, {
    title: '二手 iPhone 14 128GB',
    description: '去年购买，国行正品，99新，无划痕，配件齐全，送原装充电器。因换新机出售。',
    price: 3500,
    categoryId: catDigital.id,
    images: ['https://picsum.photos/seed/iphone14/400/400'],
    status: GoodsStatus.APPROVED,
    version: 0,
    userId: student1.id,
  });

  const goods2 = await manager.save(GoodsEntity, {
    title: '高等数学（第七版）上册',
    description: '同济大学数学系编，几乎全新，只翻了几页，期末考完出售。',
    price: 30,
    categoryId: catBooks.id,
    images: ['https://picsum.photos/seed/mathbook/400/400'],
    status: GoodsStatus.APPROVED,
    version: 0,
    userId: student1.id,
  });

  const goods3 = await manager.save(GoodsEntity, {
    title: '宿舍USB充电台灯',
    description: '三档调光，护眼模式，磁吸底座，续航8小时。',
    price: 25,
    categoryId: catDaily.id,
    images: ['https://picsum.photos/seed/lamp/400/400'],
    status: GoodsStatus.PENDING_REVIEW,
    version: 0,
    userId: student1.id,
  });

  // student2 的商品
  const goods4 = await manager.save(GoodsEntity, {
    title: '尤尼克斯羽毛球拍',
    description: '全新未使用，朋友送的礼物，自己不打球。含拍套。',
    price: 120,
    categoryId: catSports.id,
    images: ['https://picsum.photos/seed/racket/400/400'],
    status: GoodsStatus.APPROVED,
    version: 0,
    userId: student2.id,
  });

  const goods5 = await manager.save(GoodsEntity, {
    title: '英语四级真题 2024版',
    description: '华研外语，全新，送听力光盘。考过了用不上了。',
    price: 20,
    categoryId: catBooks.id,
    images: ['https://picsum.photos/seed/cet4/400/400'],
    status: GoodsStatus.SOLD,
    version: 2,
    userId: student2.id,
  });

  const goods6 = await manager.save(GoodsEntity, {
    title: 'JBL便携蓝牙音箱',
    description: 'Go 3 系列，红色，防水防尘，续航5小时。',
    price: 80,
    categoryId: catDigital.id,
    images: ['https://picsum.photos/seed/jbl/400/400'],
    status: GoodsStatus.PENDING_REVIEW,
    version: 0,
    userId: student2.id,
  });

  // ============================================================
  // 4. 审核记录
  // ============================================================
  console.log('[Seed] 插入审核记录...');
  await manager.save(ReviewRecordEntity, [
    { goodsId: goods1.id, adminId: admin.id, action: ReviewAction.APPROVED },
    { goodsId: goods2.id, adminId: admin.id, action: ReviewAction.APPROVED },
    { goodsId: goods4.id, adminId: admin.id, action: ReviewAction.APPROVED },
    { goodsId: goods5.id, adminId: admin.id, action: ReviewAction.APPROVED },
  ]);

  // ============================================================
  // 5. 订单（已售商品）
  // ============================================================
  console.log('[Seed] 插入订单...');
  await manager.save(OrderEntity, {
    buyerId: student1.id,
    sellerId: student2.id,
    goodsId: goods5.id,
    status: OrderStatus.COMPLETED,
  });

  console.log('[Seed] 种子数据插入完成！');
  console.log('');
  console.log('  测试账号：');
  console.log('  ┌──────────────┬──────────────────────┬──────────┐');
  console.log('  │ 角色         │ 邮箱                  │ 密码     │');
  console.log('  ├──────────────┼──────────────────────┼──────────┤');
  console.log('  │ 学生         │ student1@test.com    │ 123456   │');
  console.log('  │ 学生         │ student2@test.com    │ 123456   │');
  console.log('  │ 管理员       │ admin@test.com       │ 123456   │');
  console.log('  └──────────────┴──────────────────────┴──────────┘');

  await dataSource.destroy();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[Seed] 失败:', err.message);
    process.exit(1);
  });
}