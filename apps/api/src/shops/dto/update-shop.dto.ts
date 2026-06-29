import { IsString, MaxLength, IsOptional, Matches, IsBoolean, IsHexColor } from "class-validator";

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  bio?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_-]+$/)
  slug?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  themeId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  avatarVideo?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  bgImageUrl?: string;

  @IsOptional()
  @IsString()
  bgVideoUrl?: string;

  @IsOptional()
  @IsString()
  gaId?: string;

  @IsOptional()
  @IsString()
  metaPixel?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
