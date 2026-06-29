import { Module } from "@nestjs/common";
import { AppointmentsController, AppointmentsPublicController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsPublicController, AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
