import { MidwayConfig } from '@midwayjs/core';

export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        synchronize: true,
        logging: true,
      },
    },
  },
} as unknown as MidwayConfig;