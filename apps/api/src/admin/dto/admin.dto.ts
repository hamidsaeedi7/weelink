import { IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsIn(["FREE", "PRO"])
  plan?: string;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsDateString()
  planExpiresAt?: string;
}

export class CreateGlobalCouponDto {
  @IsString()
  @MaxLength(30)
  code: string;

  @IsIn(["percent", "fixed"])
  type: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsOptional()
  @IsInt()
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SendNotificationDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(1000)
  body: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsIn(["FREE", "PRO"])
  targetPlan?: string;
}

export class ChangeAdminCredentialsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  @MinLength(8, { message: "رمز عبور حداقل ۸ کاراکتر باشد" })
  password?: string;

  @IsOptional()
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  email?: string;
}
