import { Provide } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity } from '../entity/OrderEntity';
import { OrderStatus } from '../entity/OrderStatus';
import { GoodsEntity } from '../entity/GoodsEntity';
import { GoodsStatus } from '../entity/GoodsStatus';

@Provide()
export class OrderService {
  @InjectEntityModel(OrderEntity)
  orderModel: Repository<OrderEntity>;

  @InjectEntityModel(GoodsEntity)
  goodsModel: Repository<GoodsEntity>;

  @InjectDataSource()
  dataSource: DataSource;

  async createOrder(buyerId: number, goodsId: number, goodsVersion: number) {
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
      if (goods.userId === buyerId) {
        throw { status: 400, message: '不能购买自己发布的商品' };
      }
      if (goods.status !== GoodsStatus.APPROVED) {
        throw { status: 400, message: '商品不可购买' };
      }
      if (goods.version !== goodsVersion) {
        throw { status: 409, message: '商品已被其他用户购买' };
      }

      const updateResult = await queryRunner.manager
        .createQueryBuilder()
        .update(GoodsEntity)
        .set({
          status: GoodsStatus.RESERVED,
          version: () => 'version + 1',
        })
        .where('id = :id AND version = :version AND status = :status', {
          id: goodsId,
          version: goodsVersion,
          status: GoodsStatus.APPROVED,
        })
        .execute();

      if (updateResult.affected === 0) {
        throw { status: 409, message: '商品已被其他用户购买' };
      }

      const order = queryRunner.manager.create(OrderEntity, {
        buyerId,
        sellerId: goods.userId,
        goodsId,
        status: OrderStatus.PENDING,
      });

      await queryRunner.manager.save(OrderEntity, order);

      await queryRunner.commitTransaction();

      return {
        id: order.id,
        status: order.status,
        goodsId: order.goodsId,
        createdAt: order.createdAt,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrders(userId: number, page: number, pageSize: number) {
    const [items, total] = await this.orderModel.findAndCount({
      where: [
        { buyerId: userId },
        { sellerId: userId },
      ],
      relations: ['goods', 'buyer', 'seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { total, items };
  }

  async getOrderDetail(userId: number, orderId: number) {
    const order = await this.orderModel.findOne({
      where: { id: orderId },
      relations: ['goods', 'goods.user', 'goods.category', 'buyer', 'seller'],
    });

    if (!order) {
      throw { status: 404, message: '订单不存在' };
    }
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw { status: 403, message: '无权查看该订单' };
    }

    return order;
  }

  async sellerConfirm(userId: number, orderId: number) {
    const order = await this.orderModel.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw { status: 404, message: '订单不存在' };
    }
    if (order.sellerId !== userId) {
      throw { status: 403, message: '你不是该商品的卖家' };
    }
    if (order.status !== OrderStatus.PENDING) {
      throw { status: 400, message: '订单状态不是待确认，无法确认交易' };
    }

    order.status = OrderStatus.CONFIRMED;
    await this.orderModel.save(order);

    return { id: order.id, status: order.status };
  }

  async buyerConfirm(userId: number, orderId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(OrderEntity, {
        where: { id: orderId },
      });

      if (!order) {
        throw { status: 404, message: '订单不存在' };
      }
      if (order.buyerId !== userId) {
        throw { status: 403, message: '你不是该订单的买家' };
      }
      if (order.status !== OrderStatus.CONFIRMED) {
        throw { status: 400, message: '订单状态不是已确认，无法收货' };
      }

      order.status = OrderStatus.COMPLETED;
      await queryRunner.manager.save(OrderEntity, order);

      const goods = await queryRunner.manager.findOne(GoodsEntity, {
        where: { id: order.goodsId },
      });

      if (goods) {
        goods.status = GoodsStatus.SOLD;
        await queryRunner.manager.save(GoodsEntity, goods);
      }

      await queryRunner.commitTransaction();

      return { id: order.id, status: order.status, goodsStatus: GoodsStatus.SOLD };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrder(userId: number, orderId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(OrderEntity, {
        where: { id: orderId },
      });

      if (!order) {
        throw { status: 404, message: '订单不存在' };
      }
      if (order.buyerId !== userId) {
        throw { status: 403, message: '你不是该订单的买家' };
      }
      if (order.status !== OrderStatus.PENDING) {
        throw { status: 400, message: '订单状态不是待确认，无法取消' };
      }

      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(OrderEntity, order);

      const goods = await queryRunner.manager.findOne(GoodsEntity, {
        where: { id: order.goodsId },
      });

      if (goods) {
        goods.status = GoodsStatus.APPROVED;
        await queryRunner.manager.save(GoodsEntity, goods);
      }

      await queryRunner.commitTransaction();

      return { id: order.id, status: order.status, goodsStatus: GoodsStatus.APPROVED };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}