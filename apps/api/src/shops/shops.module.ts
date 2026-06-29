import { Module } from "@nestjs/common";
import { ShopsService } from "./shops.service";
import { ShopsController, MyShopController } from "./shops.controller";

@Module({
  providers: [ShopsService],
  controllers: [ShopsController, MyShopController],
  exports: [ShopsService],
})
export class ShopsModule {}
