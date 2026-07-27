import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { SmsModule } from "../sms/sms.module";
import { ContentPlansModule } from "../content-plans/content-plans.module";

@Module({
  imports: [SmsModule, ContentPlansModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
