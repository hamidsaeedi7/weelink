import { IsEmail, IsString, MinLength, IsOptional, Matches, ValidateIf } from "class-validator";

export class LoginDto {
  // ایمیل فقط برای ورود ادمین (پنل مدیر) نگه داشته شده — کاربران عادی با شماره موبایل وارد می‌شوند
  @IsOptional()
  @ValidateIf((o) => o.email !== "" && o.email != null)
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  email?: string;

  @IsOptional()
  @ValidateIf((o) => o.phone !== "" && o.phone != null)
  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone?: string;

  @IsString()
  @MinLength(8, { message: "رمز عبور حداقل ۸ کاراکتر باشد" })
  password: string;
}
