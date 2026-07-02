import { Module } from "@nestjs/common";
import { SmsModule } from "../sms/sms.module";
import { GrowthSchedulerService } from "./growth-scheduler.service";

@Module({
  imports: [SmsModule],
  providers: [GrowthSchedulerService],
})
export class GrowthModule {}
