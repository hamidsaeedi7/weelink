import { Module } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { BlocksController, BlocksPublicController } from "./blocks.controller";
import { ShopsModule } from "../shops/shops.module";

@Module({
  imports: [ShopsModule],
  providers: [BlocksService],
  controllers: [BlocksController, BlocksPublicController],
})
export class BlocksModule {}
