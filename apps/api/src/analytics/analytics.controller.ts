import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get("dashboard")
  getDashboard(
    @CurrentUser() user: { id: string },
    @Query("days") days?: string,
  ) {
    return this.analytics.getDashboard(user.id, days ? Number(days) : 30);
  }

  @Get("referers")
  getReferers(@CurrentUser() user: { id: string }) {
    return this.analytics.getReferers(user.id);
  }
}
