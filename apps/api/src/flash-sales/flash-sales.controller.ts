import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { FlashSalesService } from "./flash-sales.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("flash-sales")
export class FlashSalesController {
  constructor(private svc: FlashSalesService) {}

  @Get("public/:slug")
  getPublic(@Param("slug") slug: string) {
    return this.svc.getPublic(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.svc.findAll(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: any) {
    return this.svc.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.update(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.svc.remove(user.id, id);
  }
}
