import 'koa';

declare module 'koa' {
  interface DefaultState {
    user: {
      userId: number;
      role: string;
    };
  }
}