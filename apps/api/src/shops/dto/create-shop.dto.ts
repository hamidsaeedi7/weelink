import { IsString, MinLength, MaxLength, Matches, IsOptional } from "class-validator";

export class CreateShopDto {
  @IsString()
  @MinLength(3, { message: "نام فروشگاه حداقل ۳ کاراکتر" })
  @MaxLength(60, { message: "نام فروشگاه حداکثر ۶۰ کاراکتر" })
  name: string;

  @IsString()
  @MinLength(3, { message: "آدرس حداقل ۳ کاراکتر" })
  @MaxLength(30, { message: "آدرس حداکثر ۳۰ کاراکتر" })
  @Matches(/^[a-z0-9_-]+$/, { message: "آدرس فقط شامل حروف انگلیسی کوچک، عدد، خط تیره و زیرخط" })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: "بیو حداکثر ۲۵۰ کاراکتر" })
  bio?: string;
}
