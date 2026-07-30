import { Controller, Post, Get, Del, Body, Param, Query, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { FavoriteService } from '../service/FavoriteService';
import { FavoriteCreateDTO } from '../dto/FavoriteCreateDTO';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../util/validate';

@Controller('/api/favorites', { middleware: [AuthMiddleware] })
export class FavoriteController {
  @Inject()
  favoriteService: FavoriteService;

  @Inject()
  ctx: Context;

  @Post('/')
  async addFavorite(@Body() body: FavoriteCreateDTO) {
    const userId = this.ctx.state.user.userId;
    const validated = await validateBody(body, FavoriteCreateDTO);
    this.ctx.status = 201;
    return this.favoriteService.addFavorite(userId, validated.goodsId);
  }

  @Del('/:goodsId')
  async removeFavorite(@Param('goodsId') goodsId: number) {
    const userId = this.ctx.state.user.userId;
    return this.favoriteService.removeFavorite(userId, goodsId);
  }

  @Get('/')
  async getFavorites(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const userId = this.ctx.state.user.userId;
    return this.favoriteService.getFavorites(userId, page, pageSize);
  }
}