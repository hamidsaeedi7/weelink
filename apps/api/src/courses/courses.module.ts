import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import {
  CoursesController,
  CoursesPublicController,
  CourseLicenseController,
  CourseVideoController,
  StreamController,
} from "./courses.controller";
import { CoursesService } from "./courses.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentsModule } from "../payments/payments.module";
import { CouponsModule } from "../coupons/coupons.module";

@Module({
  imports: [PrismaModule, PaymentsModule, CouponsModule, JwtModule.register({})],
  controllers: [CoursesPublicController, CoursesController, CourseLicenseController, CourseVideoController, StreamController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
