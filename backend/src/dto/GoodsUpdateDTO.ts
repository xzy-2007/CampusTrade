import { IsString, IsNumber, IsArray, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

export class GoodsUpdateDTO {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}