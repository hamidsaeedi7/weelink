import { Module } from "@nestjs/common";
import { DigitalFilesController, DigitalFilesPublicController } from "./digital-files.controller";
import { DigitalFilesService } from "./digital-files.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DigitalFilesPublicController, DigitalFilesController],
  providers: [DigitalFilesService],
})
export class DigitalFilesModule {}
