import { Module } from "@nestjs/common";
import { GatewayCallbackController } from "./gateway-callback.controller";
import { PaymentsModule } from "../payments/payments.module";
import { DigitalFilesModule } from "../digital-files/digital-files.module";
import { CoursesModule } from "../courses/courses.module";

@Module({
  imports: [PaymentsModule, DigitalFilesModule, CoursesModule],
  controllers: [GatewayCallbackController],
})
export class GatewayCallbackModule {}
