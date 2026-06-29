import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { InvoiceService } from "./invoice.service";
import { CouponsModule } from "../coupons/coupons.module";
import { SmsModule } from "../sms/sms.module";

@Module({
  imports: [CouponsModule, SmsModule],
  providers: [OrdersService, InvoiceService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
