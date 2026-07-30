import { Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/web';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware {
  public static getName(): string {
    return 'auth';
  }

  public resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const authHeader = ctx.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ctx.status = 401;
        ctx.body = { message: '未登录，请先登录' };
        return;
      }

      const token = authHeader.slice(7);

      try {
        const jwtSecret = ctx.app.getConfig?.()?.jwt?.secret || 'campus-trade-default-secret';
        const decoded = jwt.verify(token, jwtSecret) as { userId: number; role: string };
        ctx.state.user = {
          userId: decoded.userId,
          role: decoded.role,
        };
        await next();
      } catch (err) {
        ctx.status = 401;
        ctx.body = { message: 'Token 无效或已过期' };
        return;
      }
    };
  }
}