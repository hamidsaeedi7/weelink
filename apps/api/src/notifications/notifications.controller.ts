import { Controller, Get, Put, Param, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get("mine")
  findMine(@CurrentUser() user: { id: string; plan: string }) {
    return this.notifications.findMine(user.id, user.plan);
  }

  @Put(":id/read")
  markRead(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
