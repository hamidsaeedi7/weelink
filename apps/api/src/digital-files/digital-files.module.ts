import { Module } from "@nestjs/common";
import { DigitalFilesController, DigitalFilesPublicController, DigitalFilesDownloadController } from "./digital-files.controller";
import { DigitalFilesService } from "./digital-files.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentsModule } from "../payments/payments.module";
import { CouponsModule } from "../coupons/coupons.module";

@Module({
  imports: [PrismaModule, PaymentsModule, CouponsModule],
  controllers: [DigitalFilesPublicController, DigitalFilesController, DigitalFilesDownloadController],
  providers: [DigitalFilesService],
  exports: [DigitalFilesService],
})
export class DigitalFilesModule {}
