import { Module } from "@nestjs/common";
import { CoursesController, CoursesPublicController } from "./courses.controller";
import { CoursesService } from "./courses.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CoursesPublicController, CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
