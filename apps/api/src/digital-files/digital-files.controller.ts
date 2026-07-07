import { Body, Controller, Delete, Get, Param, Post, Put, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { DigitalFilesService } from "./digital-files.service";
import { CreateDigitalFileDto, UpdateDigitalFileDto, PurchaseDigitalFileDto } from "./dto/digital-file.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/digital-files")
export class DigitalFilesPublicController {
  constructor(private svc: DigitalFilesService) {}
  @Get() findPublic(@Param("slug") slug: string) { return this.svc.findAllPublic(slug); }

  @Post(":id/purchase")
  purchase(@Param("slug") slug: string, @Param("id") id: string, @Body() dto: PurchaseDigitalFileDto) {
    return this.svc.purchase(slug, id, dto);
  }
}

@Controller("digital-files/download")
export class DigitalFilesDownloadController {
  constructor(private svc: DigitalFilesService) {}

  @Get(":token")
  async download(@Param("token") token: string, @Res() res: Response) {
    const fileUrl = await this.svc.getDownloadRedirect(token);
    res.redirect(302, fileUrl);
  }
}

@Controller("digital-files")
@UseGuards(JwtAuthGuard)
export class DigitalFilesController {
  constructor(private svc: DigitalFilesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateDigitalFileDto) { return this.svc.create(user.id, dto); }

  @Put(":id")
  update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: UpdateDigitalFileDto) {
    return this.svc.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }
}
