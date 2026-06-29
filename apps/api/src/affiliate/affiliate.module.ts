import { Module } from "@nestjs/common";
import { AffiliateController, AffiliateRedirectController } from "./affiliate.controller";
import { AffiliateService } from "./affiliate.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AffiliateRedirectController, AffiliateController],
  providers: [AffiliateService],
})
export class AffiliateModule {}
