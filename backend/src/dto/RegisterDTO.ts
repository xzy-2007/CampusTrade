import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class RegisterDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}