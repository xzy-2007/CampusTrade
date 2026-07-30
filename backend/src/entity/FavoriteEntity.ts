import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './UserEntity';
import { GoodsEntity } from './GoodsEntity';

@Entity('favorites')
@Unique(['userId', 'goodsId'])
export class FavoriteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'goods_id' })
  goodsId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => GoodsEntity, (goods) => goods.favorites, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'goods_id' })
  goods: GoodsEntity;
}