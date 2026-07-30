import { IsString, IsNumber, IsArray, Min, MinLength, MaxLength } from 'class-validator';

export class GoodsCreateDTO {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  categoryId: number;

  @IsArray()
  @IsString({ each: true })
  images: string[];
}