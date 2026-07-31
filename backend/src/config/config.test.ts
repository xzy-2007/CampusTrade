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
  security: {
    csrf: {
      enable: false,
    },
  },
};