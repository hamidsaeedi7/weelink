import { Module } from "@nestjs/common";
import { ShortLinksController, ShortLinksRedirectController } from "./short-links.controller";
import { ShortLinksService } from "./short-links.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ShortLinksRedirectController, ShortLinksController],
  providers: [ShortLinksService],
})
export class ShortLinksModule {}
