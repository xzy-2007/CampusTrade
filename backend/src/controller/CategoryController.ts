import { Controller, Get, Inject } from '@midwayjs/core';
import { CategoryService } from '../service/CategoryService';

@Controller('/api/categories')
export class CategoryController {
  @Inject()
  categoryService: CategoryService;

  @Get('/')
  async getCategoryList() {
    return this.categoryService.getCategoryList();
  }
}