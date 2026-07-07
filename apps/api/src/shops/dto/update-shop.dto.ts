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
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaDesc?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cardNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  cardHolder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  deliveryType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryContact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryNote?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
