import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewAction } from './ReviewAction';
import { GoodsEntity } from './GoodsEntity';
import { UserEntity } from './UserEntity';

@Entity('review_records')
export class ReviewRecordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'goods_id' })
  goodsId: number;

  @Column({ name: 'admin_id' })
  adminId: number;

  @Column({
    type: 'enum',
    enum: ReviewAction,
  })
  action: ReviewAction;

  @Column({ length: 500, nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => GoodsEntity, (goods) => goods.reviewRecords, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'goods_id' })
  goods: GoodsEntity;

  @ManyToOne(() => UserEntity, (user) => user.reviewRecords, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'admin_id' })
  admin: UserEntity;
}