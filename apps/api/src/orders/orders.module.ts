import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { InvoiceService } from "./invoice.service";
import { CouponsModule } from "../coupons/coupons.module";
import { SmsModule } from "../sms/sms.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [CouponsModule, SmsModule, PaymentsModule],
  providers: [OrdersService, InvoiceService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
