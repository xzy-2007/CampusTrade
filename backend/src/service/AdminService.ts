import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GoodsEntity } from '../entity/GoodsEntity';
import { GoodsStatus } from '../entity/GoodsStatus';
import { ReviewRecordEntity } from '../entity/ReviewRecordEntity';
import { ReviewAction } from '../entity/ReviewAction';

@Provide()
export class AdminService {
  @InjectEntityModel(GoodsEntity)
  goodsModel: Repository<GoodsEntity>;

  @InjectEntityModel(ReviewRecordEntity)
  reviewRecordModel: Repository<ReviewRecordEntity>;

  @InjectDataSource()
  dataSource: DataSource;

  async getPendingGoods(page: number, pageSize: number) {
    const [items, total] = await this.goodsModel.findAndCount({
      where: { status: GoodsStatus.PENDING_REVIEW },
      relations: ['user', 'category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, items };
  }

  async reviewGoods(adminId: number, goodsId: number, action: 'approved' | 'rejected', reason?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const goods = await queryRunner.manager.findOne(GoodsEntity, {
        where: { id: goodsId },
      });

      if (!goods) {
        throw { status: 404, message: '商品不存在' };
      }
      if (goods.status !== GoodsStatus.PENDING_REVIEW) {
        throw { status: 400, message: '商品状态不是待审核，无法审核' };
      }

      if (action === 'approved') {
        goods.status = GoodsStatus.APPROVED;
      } else {
        if (!reason) {
          throw { status: 400, message: '驳回时必须填写理由' };
        }
        goods.status = GoodsStatus.REJECTED;
      }

      await queryRunner.manager.save(GoodsEntity, goods);

      const reviewRecord = queryRunner.manager.create(ReviewRecordEntity, {
        goodsId,
        adminId,
        action: action === 'approved' ? ReviewAction.APPROVED : ReviewAction.REJECTED,
        reason: reason || undefined,
      });

      await queryRunner.manager.save(ReviewRecordEntity, reviewRecord);

      await queryRunner.commitTransaction();

      return { id: goods.id, status: goods.status };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async forceRemoveGoods(adminId: number, goodsId: number) {
    const goods = await this.goodsModel.findOne({ where: { id: goodsId } });

    if (!goods) {
      throw { status: 404, message: '商品不存在' };
    }

    goods.status = GoodsStatus.REMOVED;
    await this.goodsModel.save(goods);

    return { id: goods.id, status: goods.status };
  }

  async getReviewRecords(page: number, pageSize: number, goodsId?: number) {
    const where: Record<string, unknown> = {};

    if (goodsId) {
      where.goodsId = goodsId;
    }

    const [items, total] = await this.reviewRecordModel.findAndCount({
      where,
      relations: ['goods', 'admin'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, items };
  }
}