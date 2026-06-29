import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, Min, Max } from "class-validator";

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsIn(["percent", "fixed"])
  type: "percent" | "fixed";

  @IsNumber()
  @Min(1)
  @Max(100)
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
