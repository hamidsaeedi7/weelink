import { IsOptional, IsEmail, Matches } from "class-validator";

export class ForgotPasswordDto {
  @IsOptional()
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  email?: string;

  @IsOptional()
  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone?: string;
}
