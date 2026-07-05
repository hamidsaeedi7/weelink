import {
  IsString, IsNumber, IsOptional, IsArray,
  IsBoolean, IsEnum, Min, MaxLength,
} from "class-validator";
import { ProductType } from "@prisma/client";

export class CreateProductDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  prepTime?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsNumber()
  @Min(-1)
  stock?: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
