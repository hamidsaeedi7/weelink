import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class PurchaseCourseDto {
  @IsString()
  @MinLength(2, { message: "نام و نام خانوادگی را وارد کنید" })
  @MaxLength(60)
  buyerName: string;

  @IsString()
  @Matches(/^09\d{9}$/, { message: "شماره موبایل معتبر نیست" })
  buyerPhone: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class RedeemLicenseDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  code: string;

  @IsString()
  @Matches(/^09\d{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone: string;
}
