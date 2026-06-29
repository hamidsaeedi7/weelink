import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  IsBoolean,
} from 'class-validator';
export class CreateContentPlanDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  platform: string; // instagram|telegram|youtube|twitter|other

  @IsString()
  contentType: string; // post|story|reel|video|text|other

  @IsDateString()
  scheduledAt: string; // ISO string, user sends Gregorian equivalent of their Jalali input

  @IsOptional()
  @IsString()
  color?: string;

  @IsArray()
  @IsInt({ each: true })
  notifyBefore: number[]; // e.g. [24, 2]

  @IsBoolean()
  notifyViaSms: boolean;

  @IsBoolean()
  notifyViaEmail: boolean;

  @IsBoolean()
  notifyViaTelegram: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContentPlanDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() platform?: string;
  @IsOptional() @IsString() contentType?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsArray() @IsInt({ each: true }) notifyBefore?: number[];
  @IsOptional() @IsBoolean() notifyViaSms?: boolean;
  @IsOptional() @IsBoolean() notifyViaEmail?: boolean;
  @IsOptional() @IsBoolean() notifyViaTelegram?: boolean;
  @IsOptional() @IsString() status?: string;
}
