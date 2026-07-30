import { Bootstrap } from '@midwayjs/bootstrap';
import { ContainerConfiguration } from './configuration';

Bootstrap
  .configure({
    module: ContainerConfiguration,
  })
  .run();