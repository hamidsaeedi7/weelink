import { Module } from "@nestjs/common";
import { BrandKitService } from "./brand-kit.service";
import { BrandKitController } from "./brand-kit.controller";

@Module({
  providers: [BrandKitService],
  controllers: [BrandKitController],
})
export class BrandKitModule {}
