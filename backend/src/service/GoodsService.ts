import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, Like } from 'typeorm';
import { GoodsEntity } from '../entity/GoodsEntity';
import { GoodsStatus } from '../entity/GoodsStatus';
import { GoodsCreateDTO } from '../dto/GoodsCreateDTO';
import { GoodsUpdateDTO } from '../dto/GoodsUpdateDTO';

@Provide()
export class GoodsService {
  @InjectEntityModel(GoodsEntity)
  goodsModel: Repository<GoodsEntity>;

  async create(userId: number, data: GoodsCreateDTO) {
    const goods = this.goodsModel.create({
      title: data.title,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      images: data.images,
      userId,
      status: GoodsStatus.PENDING_REVIEW,
      version: 0,
    });

    await this.goodsModel.save(goods);
    return goods;
  }

  async list(
    page: number,
    pageSize: number,
    categoryId?: number,
    keyword?: string,
  ) {
    const where: Record<string, unknown> = {
      status: GoodsStatus.APPROVED,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }

    const [items, total] = await this.goodsModel.findAndCount({
      where,
      relations: ['user', 'category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, page, pageSize, items };
  }

  async getById(goodsId: number, currentUserId?: number) {
    const goods = await this.goodsModel.findOne({
      where: { id: goodsId },
      relations: ['user', 'category'],
    });

    if (!goods) {
      throw { status: 404, message: '商品不存在' };
    }

    const isOwner = currentUserId !== undefined && goods.userId === currentUserId;

    if (!isOwner && goods.status !== GoodsStatus.APPROVED) {
      throw { status: 404, message: '商品不存在' };
    }

    return goods;
  }

  async update(userId: number, goodsId: number, data: GoodsUpdateDTO) {
    const goods = await this.goodsModel.findOne({ where: { id: goodsId } });

    if (!goods) {
      throw { status: 404, message: '商品不存在' };
    }
    if (goods.userId !== userId) {
      throw { status: 403, message: '无权限修改该商品' };
    }

    if (data.title !== undefined) {
      goods.title = data.title;
    }
    if (data.description !== undefined) {
      goods.description = data.description;
    }
    if (data.price !== undefined) {
      goods.price = data.price;
    }
    if (data.categoryId !== undefined) {
      goods.categoryId = data.categoryId;
    }
    if (data.images !== undefined) {
      goods.images = data.images;
    }

    if (goods.status !== GoodsStatus.REJECTED) {
      goods.status = GoodsStatus.PENDING_REVIEW;
    }

    await this.goodsModel.save(goods);
    return goods;
  }

  async remove(userId: number, goodsId: number) {
    const goods = await this.goodsModel.findOne({ where: { id: goodsId } });

    if (!goods) {
      throw { status: 404, message: '商品不存在' };
    }
    if (goods.userId !== userId) {
      throw { status: 403, message: '无权限删除该商品' };
    }

    goods.status = GoodsStatus.REMOVED;
    await this.goodsModel.save(goods);

    return { id: goods.id, status: goods.status };
  }

  async resubmit(userId: number, goodsId: number, data: GoodsCreateDTO) {
    const goods = await this.goodsModel.findOne({ where: { id: goodsId } });

    if (!goods) {
      throw { status: 404, message: '商品不存在' };
    }
    if (goods.userId !== userId) {
      throw { status: 403, message: '无权限操作该商品' };
    }
    if (goods.status !== GoodsStatus.REJECTED) {
      throw { status: 400, message: '只有审核驳回的商品可以重新提交' };
    }

    goods.title = data.title;
    goods.description = data.description;
    goods.price = data.price;
    goods.categoryId = data.categoryId;
    goods.images = data.images;
    goods.status = GoodsStatus.PENDING_REVIEW;

    await this.goodsModel.save(goods);

    return { id: goods.id, status: goods.status };
  }
}