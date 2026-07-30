import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './UserRole';
import { GoodsEntity } from './GoodsEntity';
import { FavoriteEntity } from './FavoriteEntity';
import { OrderEntity } from './OrderEntity';
import { ReviewRecordEntity } from './ReviewRecordEntity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GoodsEntity, (goods) => goods.user)
  goods: GoodsEntity[];

  @OneToMany(() => FavoriteEntity, (favorite) => favorite.user)
  favorites: FavoriteEntity[];

  @OneToMany(() => OrderEntity, (order) => order.buyer)
  ordersAsBuyer: OrderEntity[];

  @OneToMany(() => OrderEntity, (order) => order.seller)
  ordersAsSeller: OrderEntity[];

  @OneToMany(() => ReviewRecordEntity, (record) => record.admin)
  reviewRecords: ReviewRecordEntity[];
}