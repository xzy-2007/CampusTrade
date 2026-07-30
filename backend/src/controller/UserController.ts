import { Controller, Get, Put, Body, Inject, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { UserService } from '../service/UserService';
import { UserUpdateDTO } from '../dto/UserUpdateDTO';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../util/validate';

@Controller('/api/users', { middleware: [AuthMiddleware] })
export class UserController {
  @Inject()
  userService: UserService;

  @Inject()
  ctx: Context;

  @Get('/profile')
  async getProfile() {
    const userId = this.ctx.state.user.userId;
    return this.userService.getProfile(userId);
  }

  @Put('/profile')
  async updateProfile(@Body() body: UserUpdateDTO) {
    const userId = this.ctx.state.user.userId;
    const validated = await validateBody(body, UserUpdateDTO);
    return this.userService.updateProfile(userId, validated);
  }

  @Get('/goods')
  async getMyGoods(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const userId = this.ctx.state.user.userId;
    return this.userService.getMyGoods(userId, page, pageSize);
  }

  @Get('/favorites')
  async getMyFavorites(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const userId = this.ctx.state.user.userId;
    return this.userService.getMyFavorites(userId, page, pageSize);
  }
}