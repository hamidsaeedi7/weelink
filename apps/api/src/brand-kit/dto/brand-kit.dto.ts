import { IsOptional, IsString, MaxLength, IsArray, ArrayMaxSize } from "class-validator";

export class UpdateBrandKitDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  fontFamily?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  defaultCta?: string;
}
