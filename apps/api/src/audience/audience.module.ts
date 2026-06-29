import { Module } from "@nestjs/common";
import { AudienceController, AudiencePublicController } from "./audience.controller";
import { AudienceService } from "./audience.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AudiencePublicController, AudienceController],
  providers: [AudienceService],
})
export class AudienceModule {}
