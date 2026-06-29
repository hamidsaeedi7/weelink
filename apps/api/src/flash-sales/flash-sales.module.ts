import { Module } from "@nestjs/common";
import { FlashSalesService } from "./flash-sales.service";
import { FlashSalesController } from "./flash-sales.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [FlashSalesService],
  controllers: [FlashSalesController],
})
export class FlashSalesModule {}
