import { MidwayConfig } from '@midwayjs/core';

export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        synchronize: true,
        logging: false,
      },
    },
  },
} as unknown as MidwayConfig;