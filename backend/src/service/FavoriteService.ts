import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteEntity } from '../entity/FavoriteEntity';

@Provide()
export class FavoriteService {
  @InjectEntityModel(FavoriteEntity)
  favoriteModel: Repository<FavoriteEntity>;

  async addFavorite(userId: number, goodsId: number) {
    const existing = await this.favoriteModel.findOne({
      where: { userId, goodsId },
    });

    if (existing) {
      throw { status: 409, message: '已收藏过该商品' };
    }

    const favorite = this.favoriteModel.create({
      userId,
      goodsId,
    });

    await this.favoriteModel.save(favorite);

    return {
      id: favorite.id,
      goodsId: favorite.goodsId,
      createdAt: favorite.createdAt,
    };
  }

  async removeFavorite(userId: number, goodsId: number) {
    const favorite = await this.favoriteModel.findOne({
      where: { userId, goodsId },
    });

    if (!favorite) {
      throw { status: 404, message: '收藏记录不存在' };
    }

    await this.favoriteModel.remove(favorite);

    return { message: 'ok' };
  }

  async getFavorites(userId: number, page: number, pageSize: number) {
    const [items, total] = await this.favoriteModel.findAndCount({
      where: { userId },
      relations: ['goods', 'goods.user', 'goods.category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, items };
  }
}