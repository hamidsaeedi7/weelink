import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, IsObject } from "class-validator";
import { BlockType } from "@prisma/client";

export class CreateBlockDto {
  @IsEnum(BlockType)
  type: BlockType;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  scheduleStart?: string | Date;

  @IsOptional()
  scheduleEnd?: string | Date;
}
