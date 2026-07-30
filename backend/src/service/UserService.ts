import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/UserEntity';
import { GoodsEntity } from '../entity/GoodsEntity';
import { FavoriteEntity } from '../entity/FavoriteEntity';
import { UserUpdateDTO } from '../dto/UserUpdateDTO';

@Provide()
export class UserService {
  @InjectEntityModel(UserEntity)
  userModel: Repository<UserEntity>;

  @InjectEntityModel(GoodsEntity)
  goodsModel: Repository<GoodsEntity>;

  @InjectEntityModel(FavoriteEntity)
  favoriteModel: Repository<FavoriteEntity>;

  async getProfile(userId: number) {
    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: '用户不存在' };
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: number, data: UserUpdateDTO) {
    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: '用户不存在' };
    }

    if (data.username !== undefined) {
      user.username = data.username;
    }
    if (data.avatar !== undefined) {
      user.avatar = data.avatar;
    }
    if (data.phone !== undefined) {
      user.phone = data.phone;
    }

    await this.userModel.save(user);

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      phone: user.phone,
    };
  }

  async getMyGoods(userId: number, page: number, pageSize: number) {
    const [items, total] = await this.goodsModel.findAndCount({
      where: { userId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, items };
  }

  async getMyFavorites(userId: number, page: number, pageSize: number) {
    const [items, total] = await this.favoriteModel.findAndCount({
      where: { userId },
      relations: ['goods', 'goods.category', 'goods.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, items };
  }
}