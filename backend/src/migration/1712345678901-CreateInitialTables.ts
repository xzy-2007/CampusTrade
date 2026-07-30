import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from 'typeorm';

export class CreateInitialTables1712345678901 implements MigrationInterface {
  name = 'CreateInitialTables1712345678901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. users
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'username', type: 'varchar', length: '50', isNullable: false },
          { name: 'email', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'password_hash', type: 'varchar', length: '255', isNullable: false },
          { name: 'avatar', type: 'varchar', length: '255', isNullable: true },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          {
            name: 'role',
            type: 'enum',
            enum: ['user', 'admin'],
            default: `'user'`,
            isNullable: false,
          },
          { name: 'is_active', type: 'tinyint', default: 1, isNullable: false },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'idx_users_role', columnNames: ['role'] }),
    );

    // ============================================================
    // 2. categories
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar', length: '50', isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
      true,
    );

    // ============================================================
    // 3. goods
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'goods',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'title', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
          { name: 'price', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'images', type: 'json', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['PendingReview', 'Rejected', 'Approved', 'Reserved', 'Sold', 'Removed'],
            default: `'PendingReview'`,
            isNullable: false,
          },
          { name: 'version', type: 'int', default: 0, isNullable: false },
          { name: 'user_id', type: 'int', isNullable: false },
          { name: 'category_id', type: 'int', isNullable: false },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'goods',
      new TableIndex({ name: 'idx_goods_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'goods',
      new TableIndex({ name: 'idx_goods_category_id', columnNames: ['category_id'] }),
    );
    await queryRunner.createIndex(
      'goods',
      new TableIndex({ name: 'idx_goods_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'goods',
      new TableIndex({ name: 'idx_goods_status_created', columnNames: ['status', 'created_at'] }),
    );

    await queryRunner.createForeignKey(
      'goods',
      new TableForeignKey({
        name: 'fk_goods_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
    await queryRunner.createForeignKey(
      'goods',
      new TableForeignKey({
        name: 'fk_goods_category_id',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );

    // ============================================================
    // 4. favorites
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'favorites',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'user_id', type: 'int', isNullable: false },
          { name: 'goods_id', type: 'int', isNullable: false },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
        uniques: [
          new TableUnique({
            name: 'uk_favorites_user_goods',
            columnNames: ['user_id', 'goods_id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'favorites',
      new TableIndex({ name: 'idx_favorites_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'favorites',
      new TableIndex({ name: 'idx_favorites_goods_id', columnNames: ['goods_id'] }),
    );

    await queryRunner.createForeignKey(
      'favorites',
      new TableForeignKey({
        name: 'fk_favorites_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
    await queryRunner.createForeignKey(
      'favorites',
      new TableForeignKey({
        name: 'fk_favorites_goods_id',
        columnNames: ['goods_id'],
        referencedTableName: 'goods',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );

    // ============================================================
    // 5. orders
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'buyer_id', type: 'int', isNullable: false },
          { name: 'seller_id', type: 'int', isNullable: false },
          { name: 'goods_id', type: 'int', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
            default: `'Pending'`,
            isNullable: false,
          },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_buyer_id', columnNames: ['buyer_id'] }),
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_seller_id', columnNames: ['seller_id'] }),
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_goods_id', columnNames: ['goods_id'] }),
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_buyer_status', columnNames: ['buyer_id', 'status'] }),
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_seller_status', columnNames: ['seller_id', 'status'] }),
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_buyer_id',
        columnNames: ['buyer_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_seller_id',
        columnNames: ['seller_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_goods_id',
        columnNames: ['goods_id'],
        referencedTableName: 'goods',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );

    // ============================================================
    // 6. review_records
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'review_records',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'goods_id', type: 'int', isNullable: false },
          { name: 'admin_id', type: 'int', isNullable: false },
          {
            name: 'action',
            type: 'enum',
            enum: ['approved', 'rejected'],
            isNullable: false,
          },
          { name: 'reason', type: 'varchar', length: '500', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'review_records',
      new TableIndex({ name: 'idx_review_records_goods_id', columnNames: ['goods_id'] }),
    );
    await queryRunner.createIndex(
      'review_records',
      new TableIndex({ name: 'idx_review_records_admin_id', columnNames: ['admin_id'] }),
    );
    await queryRunner.createIndex(
      'review_records',
      new TableIndex({ name: 'idx_review_records_created_at', columnNames: ['created_at'] }),
    );

    await queryRunner.createForeignKey(
      'review_records',
      new TableForeignKey({
        name: 'fk_review_records_goods_id',
        columnNames: ['goods_id'],
        referencedTableName: 'goods',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
    await queryRunner.createForeignKey(
      'review_records',
      new TableForeignKey({
        name: 'fk_review_records_admin_id',
        columnNames: ['admin_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_records');
    await queryRunner.dropTable('orders');
    await queryRunner.dropTable('favorites');
    await queryRunner.dropTable('goods');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('users');
  }
}