import { IsEmail, IsString, MinLength, IsOptional, Matches } from "class-validator";

export class LoginDto {
  @IsOptional()
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  email?: string;

  @IsOptional()
  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;
}
