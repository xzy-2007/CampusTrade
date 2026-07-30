import { IsString, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';

export class UserUpdateDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}