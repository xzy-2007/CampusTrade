import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/web';
import * as typeorm from '@midwayjs/typeorm';
import { join } from 'path';

@Configuration({
  imports: [koa, typeorm],
  importConfigs: [join(__dirname, './config')],
})
export class ContainerConfiguration {
  @App()
  app: koa.Application;
}