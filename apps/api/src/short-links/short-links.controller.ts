import { Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ShortLinksService } from "./short-links.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("s")
export class ShortLinksRedirectController {
  constructor(private svc: ShortLinksService) {}
  @Get(":code")
  async redirect(@Param("code") code: string, @Res() res: any) {
    const url = await this.svc.redirect(code);
    return res.redirect(302, url);
  }
}

@Controller("short-links")
@UseGuards(JwtAuthGuard)
export class ShortLinksController {
  constructor(private svc: ShortLinksService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: any) { return this.svc.create(user.id, dto); }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }
}
