import { Controller, Post, Get, Body, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { AuthService } from '../service/AuthService';
import { RegisterDTO } from '../dto/RegisterDTO';
import { LoginDTO } from '../dto/LoginDTO';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../util/validate';

@Controller('/api/auth')
export class AuthController {
  @Inject()
  authService: AuthService;

  @Inject()
  ctx: Context;

  @Post('/register', { middleware: [] })
  async register(@Body() body: RegisterDTO) {
    const validated = await validateBody(body, RegisterDTO);
    const data = await this.authService.register(validated);
    this.ctx.status = 201;
    return data;
  }

  @Post('/login', { middleware: [] })
  async login(@Body() body: LoginDTO) {
    const validated = await validateBody(body, LoginDTO);
    return this.authService.login(validated);
  }

  @Get('/me', { middleware: [AuthMiddleware] })
  async getMe() {
    const userId = this.ctx.state.user.userId;
    return this.authService.getCurrentUser(userId);
  }
}