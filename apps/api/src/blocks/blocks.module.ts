import { Module } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { BlocksController, BlocksPublicController } from "./blocks.controller";

@Module({
  providers: [BlocksService],
  controllers: [BlocksController, BlocksPublicController],
})
export class BlocksModule {}
