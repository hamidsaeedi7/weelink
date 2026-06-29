import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/products")
export class ProductsPublicController {
  constructor(private products: ProductsService) {}

  @Get()
  findPublic(@Param("slug") slug: string) {
    return this.products.findAllPublic(slug);
  }
}

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.products.findAllOwner(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateProductDto) {
    return this.products.create(user.id, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.products.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.products.remove(user.id, id);
  }
}
