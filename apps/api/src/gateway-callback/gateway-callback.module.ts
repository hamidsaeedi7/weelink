import { Module } from "@nestjs/common";
import { GatewayCallbackController } from "./gateway-callback.controller";
import { PaymentsModule } from "../payments/payments.module";
import { DigitalFilesModule } from "../digital-files/digital-files.module";
import { CoursesModule } from "../courses/courses.module";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [PaymentsModule, DigitalFilesModule, CoursesModule, OrdersModule],
  controllers: [GatewayCallbackController],
})
export class GatewayCallbackModule {}
