import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto, ValidateCouponDto } from "./dto/create-coupon.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("coupons")
export class CouponsController {
  constructor(private coupons: CouponsService) {}

  @Post("validate")
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { id: string }) {
    return this.coupons.findAll(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCouponDto) {
    return this.coupons.create(user.id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.coupons.remove(user.id, id);
  }
}
