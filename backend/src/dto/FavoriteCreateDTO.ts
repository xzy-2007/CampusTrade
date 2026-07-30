import { IsNumber } from 'class-validator';

export class FavoriteCreateDTO {
  @IsNumber()
  goodsId: number;
}