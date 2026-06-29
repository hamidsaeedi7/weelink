import { IsString, IsArray, IsOptional, IsNumber, ValidateNested, Min, Matches } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @IsString()
  shopSlug: string;

  @IsString()
  customerName: string;

  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
