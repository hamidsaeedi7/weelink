import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ShippingService, AddTrackingDto, AddTrackingUpdateDto } from "./shipping.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("orders")
export class ShippingController {
  constructor(private shipping: ShippingService) {}

  /** Public: get tracking info for an order */
  @Get(":id/tracking")
  getTracking(@Param("id") id: string) {
    return this.shipping.getTracking(id);
  }

  /** Auth: set carrier + tracking code */
  @Post(":id/tracking")
  @UseGuards(JwtAuthGuard)
  addTracking(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AddTrackingDto,
  ) {
    return this.shipping.addTracking(user.id, id, dto);
  }

  /** Auth: push a status update into trackingHistory */
  @Post(":id/tracking/update")
  @UseGuards(JwtAuthGuard)
  addTrackingUpdate(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AddTrackingUpdateDto,
  ) {
    return this.shipping.addTrackingUpdate(user.id, id, dto);
  }
}
