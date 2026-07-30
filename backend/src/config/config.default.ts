import { MidwayConfig } from '@midwayjs/core';

export default {
  keys: 'campus-trade-secret-key',
  koa: {
    port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 7001,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'campus-trade-default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: process.env.DATABASE_HOST || '127.0.0.1',
        port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
        username: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'campus_trade',
        synchronize: false,
        logging: process.env.NODE_ENV === 'local' ? true : false,
        entities: ['**/entity/*.entity{.ts,.js}'],
        migrations: ['**/migration/*{.ts,.js}'],
        migrationsTableName: 'migrations_history',
        timezone: '+08:00',
        charset: 'utf8mb4',
      },
    },
  },
} as MidwayConfig;