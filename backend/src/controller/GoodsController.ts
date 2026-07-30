import {
  Controller,
  Post,
  Get,
  Put,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { GoodsService } from '../service/GoodsService';
import { GoodsCreateDTO } from '../dto/GoodsCreateDTO';
import { GoodsUpdateDTO } from '../dto/GoodsUpdateDTO';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../util/validate';

@Controller('/api/goods')
export class GoodsController {
  @Inject()
  goodsService: GoodsService;

  @Inject()
  ctx: Context;

  @Post('/', { middleware: [AuthMiddleware] })
  async create(@Body() body: GoodsCreateDTO) {
    const userId = this.ctx.state.user.userId;
    const validated = await validateBody(body, GoodsCreateDTO);
    this.ctx.status = 201;
    return this.goodsService.create(userId, validated);
  }

  @Get('/')
  async list(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('categoryId') categoryId?: number,
    @Query('search') search?: string,
  ) {
    return this.goodsService.list(page, pageSize, categoryId, search);
  }

  @Get('/:id')
  async getById(@Param('id') id: number) {
    const currentUserId = this.ctx.state.user?.userId;
    return this.goodsService.getById(id, currentUserId);
  }

  @Put('/:id', { middleware: [AuthMiddleware] })
  async update(
    @Param('id') id: number,
    @Body() body: GoodsUpdateDTO,
  ) {
    const userId = this.ctx.state.user.userId;
    const validated = await validateBody(body, GoodsUpdateDTO);
    return this.goodsService.update(userId, id, validated);
  }

  @Del('/:id', { middleware: [AuthMiddleware] })
  async remove(@Param('id') id: number) {
    const userId = this.ctx.state.user.userId;
    return this.goodsService.remove(userId, id);
  }

  @Put('/:id/resubmit', { middleware: [AuthMiddleware] })
  async resubmit(
    @Param('id') id: number,
    @Body() body: GoodsCreateDTO,
  ) {
    const userId = this.ctx.state.user.userId;
    const validated = await validateBody(body, GoodsCreateDTO);
    return this.goodsService.resubmit(userId, id, validated);
  }
}