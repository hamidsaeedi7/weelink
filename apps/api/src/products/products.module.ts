import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController, ProductsPublicController } from "./products.controller";

@Module({
  providers: [ProductsService],
  controllers: [ProductsController, ProductsPublicController],
  exports: [ProductsService],
})
export class ProductsModule {}
