import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from "@nestjs/common";
import { DomainsService } from "./domains.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("domains")
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(private domains: DomainsService) {}

  // POST /domains — add custom domain
  @Post()
  addDomain(
    @CurrentUser() user: { id: string },
    @Body("domain") domain: string,
  ) {
    return this.domains.addDomain(user.id, domain);
  }

  // GET /domains — get my domain info
  @Get()
  getMyDomain(@CurrentUser() user: { id: string }) {
    return this.domains.getMyDomain(user.id);
  }

  // POST /domains/verify — trigger DNS verification
  @Post("verify")
  verifyDomain(@CurrentUser() user: { id: string }) {
    return this.domains.verifyDomain(user.id);
  }

  // DELETE /domains — remove custom domain
  @Delete()
  removeDomain(@CurrentUser() user: { id: string }) {
    return this.domains.removeDomain(user.id);
  }
}
