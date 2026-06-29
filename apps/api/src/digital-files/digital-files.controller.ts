import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { DigitalFilesService } from "./digital-files.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/digital-files")
export class DigitalFilesPublicController {
  constructor(private svc: DigitalFilesService) {}
  @Get() findPublic(@Param("slug") slug: string) { return this.svc.findAllPublic(slug); }
}

@Controller("digital-files")
@UseGuards(JwtAuthGuard)
export class DigitalFilesController {
  constructor(private svc: DigitalFilesService) {}

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
