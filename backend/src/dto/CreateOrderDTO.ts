import { IsNumber } from 'class-validator';

export class CreateOrderDTO {
  @IsNumber()
  goodsId: number;

  @IsNumber()
  goodsVersion: number;
}