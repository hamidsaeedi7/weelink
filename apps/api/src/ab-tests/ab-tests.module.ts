import { Module } from "@nestjs/common";
import { AbTestsController } from "./ab-tests.controller";
import { AbTestsService } from "./ab-tests.service";

@Module({
  controllers: [AbTestsController],
  providers: [AbTestsService],
  exports: [AbTestsService],
})
export class AbTestsModule {}
