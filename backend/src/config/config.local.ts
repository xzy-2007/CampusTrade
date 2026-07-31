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
};