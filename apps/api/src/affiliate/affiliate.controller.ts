import { Body, Controller, Delete, Get, Param, Post, Put, Res, UseGuards } from "@nestjs/common";
import { AffiliateService } from "./affiliate.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("ref")
export class AffiliateRedirectController {
  constructor(private svc: AffiliateService) {}
  @Get(":id")
  async redirect(@Param("id") id: string, @Res() res: any) {
    const url = await this.svc.trackClick(id);
    return res.redirect(302, url);
  }
}

@Controller("affiliate")
@UseGuards(JwtAuthGuard)
export class AffiliateController {
  constructor(private svc: AffiliateService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: any) { return this.svc.create(user.id, dto); }

  @Put(":id")
  update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }
}
