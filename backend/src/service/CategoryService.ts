import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entity/CategoryEntity';

@Provide()
export class CategoryService {
  @InjectEntityModel(CategoryEntity)
  categoryModel: Repository<CategoryEntity>;

  async getCategoryList() {
    return this.categoryModel.find({
      order: { id: 'ASC' },
    });
  }
}