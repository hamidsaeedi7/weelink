import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsOptional()
  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "رمز عبور حداقل ۸ کاراکتر باشد" })
  password?: string;
}
