import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { BrandKitService } from "./brand-kit.service";
import { UpdateBrandKitDto } from "./dto/brand-kit.dto";

// CurrentUser ignores any argument and yields the whole user object.
@Controller("brand-kit")
@UseGuards(JwtAuthGuard)
export class BrandKitController {
  constructor(private readonly service: BrandKitService) {}

  @Get()
  find(@CurrentUser() user: any) {
    return this.service.find(user.id);
  }

  @Put()
  upsert(@CurrentUser() user: any, @Body() dto: UpdateBrandKitDto) {
    return this.service.upsert(user.id, dto);
  }
}
