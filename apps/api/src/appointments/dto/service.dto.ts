import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

  @IsOptional()
  @IsIn(["DAILY", "WEEKLY", "MONTHLY"])
  bookingWindow?: string;

  @IsOptional()
  @IsArray()
  workDays?: number[];

  @IsOptional()
  @Matches(TIME_RE, { message: "ساعت شروع نامعتبر است" })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_RE, { message: "ساعت پایان نامعتبر است" })
  endTime?: string;

  @IsOptional()
  @IsInt()
  @IsIn([15, 30, 60])
  slotMinutes?: number;
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

  @IsOptional()
  @IsIn(["DAILY", "WEEKLY", "MONTHLY"])
  bookingWindow?: string;

  @IsOptional()
  @IsArray()
  workDays?: number[];

  @IsOptional()
  @Matches(TIME_RE, { message: "ساعت شروع نامعتبر است" })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_RE, { message: "ساعت پایان نامعتبر است" })
  endTime?: string;

  @IsOptional()
  @IsInt()
  @IsIn([15, 30, 60])
  slotMinutes?: number;
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
