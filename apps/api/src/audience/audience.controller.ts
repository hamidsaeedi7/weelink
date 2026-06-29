import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AudienceService } from "./audience.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/audience")
export class AudiencePublicController {
  constructor(private svc: AudienceService) {}
  @Post("subscribe")
  subscribe(@Param("slug") slug: string, @Body() dto: any) { return this.svc.addLead(slug, dto); }
}

@Controller("audience")
@UseGuards(JwtAuthGuard)
export class AudienceController {
  constructor(private svc: AudienceService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }
}
