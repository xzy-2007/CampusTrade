import { IsString, IsIn, IsOptional } from 'class-validator';

export class GoodsReviewDTO {
  @IsString()
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reason?: string;
}