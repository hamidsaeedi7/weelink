import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class CreateServiceDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMins?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "رنگ باید کد هگز معتبر باشد" })
  color?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMins?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "رنگ باید کد هگز معتبر باشد" })
  color?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
