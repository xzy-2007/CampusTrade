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
};