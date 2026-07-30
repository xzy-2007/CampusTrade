import { Controller, Post, Get, Put, Body, Param, Query, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { OrderService } from '../service/OrderService';
import { CreateOrderDTO } from '../dto/CreateOrderDTO';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../util/validate';

@Controller('/api/orders', { middleware: [AuthMiddleware] })
export class OrderController {
  @Inject()
  orderService: OrderService;

  @Inject()
  ctx: Context;

  @Post('/')
  async createOrder(@Body() body: CreateOrderDTO) {
    const userId = this.ctx.state.user.userId;
    const validated = await validateBody(body, CreateOrderDTO);
    this.ctx.status = 201;
    return this.orderService.createOrder(userId, validated.goodsId, validated.goodsVersion);
  }

  @Get('/')
  async getOrders(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const userId = this.ctx.state.user.userId;
    return this.orderService.getOrders(userId, page, pageSize);
  }

  @Get('/:id')
  async getOrderDetail(@Param('id') id: number) {
    const userId = this.ctx.state.user.userId;
    return this.orderService.getOrderDetail(userId, id);
  }

  @Put('/:id/seller-confirm')
  async sellerConfirm(@Param('id') id: number) {
    const userId = this.ctx.state.user.userId;
    return this.orderService.sellerConfirm(userId, id);
  }

  @Put('/:id/buyer-confirm')
  async buyerConfirm(@Param('id') id: number) {
    const userId = this.ctx.state.user.userId;
    return this.orderService.buyerConfirm(userId, id);
  }

  @Put('/:id/cancel')
  async cancelOrder(@Param('id') id: number) {
    const userId = this.ctx.state.user.userId;
    return this.orderService.cancelOrder(userId, id);
  }
}