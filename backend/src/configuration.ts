import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/web';
import * as typeorm from '@midwayjs/typeorm';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { join } from 'path';

@Configuration({
  imports: [koa, typeorm],
  importConfigs: [join(__dirname, './config')],
})
export class ContainerConfiguration {
  @App()
  app: koa.Application;

  @InjectDataSource()
  dataSource: DataSource;

  async onReady() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.runMigrations();
    }
  }

  async onStop() {
    // TODO: 应用关闭前的清理逻辑
  }
}