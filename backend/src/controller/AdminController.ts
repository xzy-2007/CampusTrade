import { Controller, Get, Put, Body, Param, Query, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { AdminService } from '../service/AdminService';
import { GoodsReviewDTO } from '../dto/GoodsReviewDTO';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../util/validate';

@Controller('/api/admin', { middleware: [AuthMiddleware] })
export class AdminController {
  @Inject()
  adminService: AdminService;

  @Inject()
  ctx: Context;

  private checkAdmin() {
    if (this.ctx.state.user.role !== 'admin') {
      this.ctx.status = 403;
      throw { status: 403, message: '需要管理员权限' };
    }
  }

  @Get('/goods')
  async getPendingGoods(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    this.checkAdmin();
    return this.adminService.getPendingGoods(page, pageSize);
  }

  @Put('/goods/:id/review')
  async reviewGoods(
    @Param('id') id: number,
    @Body() body: GoodsReviewDTO,
  ) {
    this.checkAdmin();
    const adminId = this.ctx.state.user.userId;
    const validated = await validateBody(body, GoodsReviewDTO);
    return this.adminService.reviewGoods(adminId, id, validated.action, validated.reason);
  }

  @Put('/goods/:id/force-remove')
  async forceRemoveGoods(@Param('id') id: number) {
    this.checkAdmin();
    const adminId = this.ctx.state.user.userId;
    return this.adminService.forceRemoveGoods(adminId, id);
  }

  @Get('/review-records')
  async getReviewRecords(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('goodsId') goodsId?: number,
  ) {
    this.checkAdmin();
    return this.adminService.getReviewRecords(page, pageSize, goodsId);
  }
}