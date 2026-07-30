import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { GoodsStatus } from './GoodsStatus';
import { UserEntity } from './UserEntity';
import { CategoryEntity } from './CategoryEntity';
import { FavoriteEntity } from './FavoriteEntity';
import { OrderEntity } from './OrderEntity';
import { ReviewRecordEntity } from './ReviewRecordEntity';

@Entity('goods')
export class GoodsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'json' })
  images: string[];

  @Column({
    type: 'enum',
    enum: GoodsStatus,
    default: GoodsStatus.PENDING_REVIEW,
  })
  status: GoodsStatus;

  @Column({ type: 'int', default: 0 })
  version: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.goods, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.goods, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @OneToMany(() => FavoriteEntity, (favorite) => favorite.goods)
  favorites: FavoriteEntity[];

  @OneToMany(() => OrderEntity, (order) => order.goods)
  orders: OrderEntity[];

  @OneToMany(() => ReviewRecordEntity, (record) => record.goods)
  reviewRecords: ReviewRecordEntity[];
}