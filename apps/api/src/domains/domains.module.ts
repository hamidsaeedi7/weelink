import { Module } from "@nestjs/common";
import { DomainsController, DomainsPublicController } from "./domains.controller";
import { DomainsService } from "./domains.service";
import { ArvanCdnService } from "./arvan-cdn.service";

@Module({
  controllers: [DomainsController, DomainsPublicController],
  providers: [DomainsService, ArvanCdnService],
  exports: [DomainsService],
})
export class DomainsModule {}
