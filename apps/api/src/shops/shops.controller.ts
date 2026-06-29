import { Body, Controller, Get, Param, Post, Put, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { ShopsService } from "./shops.service";
import { CreateShopDto } from "./dto/create-shop.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops")
export class ShopsController {
  constructor(private shops: ShopsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateShopDto) {
    return this.shops.create(user.id, dto);
  }

  @Get("check-slug")
  checkSlug(@Query("slug") slug: string) {
    return this.shops.checkSlug(slug);
  }

  @Get("public/slugs")
  getAllSlugs() {
    return this.shops.getAllPublicSlugs();
  }

  @Get(":slug")
  async findBySlug(@Param("slug") slug: string, @Req() req: Request) {
    const ip = req.ip;
    const ua = req.headers["user-agent"];
    const ref = req.headers["referer"] as string;
    await this.shops.recordPageView(slug, ip, ua, ref);
    return this.shops.findBySlug(slug);
  }
}

@Controller("me/shop")
@UseGuards(JwtAuthGuard)
export class MyShopController {
  constructor(private shops: ShopsService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.shops.findByUser(user.id);
  }

  @Put()
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdateShopDto) {
    return this.shops.update(user.id, dto);
  }
}
