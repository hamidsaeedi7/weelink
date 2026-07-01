import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AudienceService } from "./audience.service";
import { AddLeadDto } from "./dto/add-lead.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/audience")
export class AudiencePublicController {
  constructor(private svc: AudienceService) {}
  @Post("subscribe")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  subscribe(@Param("slug") slug: string, @Body() dto: AddLeadDto) { return this.svc.addLead(slug, dto); }
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
