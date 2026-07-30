import { MidwayConfig } from '@midwayjs/core';

export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        synchronize: false,
        logging: false,
      },
    },
  },
  security: {
    csrf: {
      enable: false,
    },
  },
} as unknown as MidwayConfig;