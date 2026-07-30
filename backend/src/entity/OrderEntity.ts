import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from './OrderStatus';
import { UserEntity } from './UserEntity';
import { GoodsEntity } from './GoodsEntity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'buyer_id' })
  buyerId: number;

  @Column({ name: 'seller_id' })
  sellerId: number;

  @Column({ name: 'goods_id' })
  goodsId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.ordersAsBuyer, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.ordersAsSeller, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'seller_id' })
  seller: UserEntity;

  @ManyToOne(() => GoodsEntity, (goods) => goods.orders, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'goods_id' })
  goods: GoodsEntity;
}