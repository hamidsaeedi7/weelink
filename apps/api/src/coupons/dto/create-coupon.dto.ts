import { IsString, IsNumber, IsOptional, IsIn, Min } from "class-validator";

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsIn(["percent", "fixed"])
  type: "percent" | "fixed";

  // percent = 1..100, fixed = مبلغ تومان (بزرگ). سقف عمومی ۱۰۰ حذف شد چون کوپن
  // مبلغ‌ثابت را می‌شکست؛ اعتبارِ درصد در فرانت کنترل می‌شود.
  @IsNumber()
  @Min(1)
  value: number;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  expiresAt?: string;
}

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  slug?: string;
}
