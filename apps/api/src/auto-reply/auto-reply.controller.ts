import { Body, Controller, Delete, Get, Headers, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AutoReplyService } from "./auto-reply.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("auto-reply")
@UseGuards(JwtAuthGuard)
export class AutoReplyController {
  constructor(private svc: AutoReplyService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: any) { return this.svc.create(user.id, dto); }

  @Put(":id")
  update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }

  @Get("bots")
  listBots(@CurrentUser() user: { id: string }) { return this.svc.listBots(user.id); }

  @Post("bots")
  connectBot(@CurrentUser() user: { id: string }, @Body() dto: { platform: string; botToken: string }) {
    return this.svc.connectBot(user.id, dto.platform, dto.botToken);
  }

  @Delete("bots/:platform")
  disconnectBot(@CurrentUser() user: { id: string }, @Param("platform") platform: string) {
    return this.svc.disconnectBot(user.id, platform);
  }
}

// Public — Telegram/Bale POST updates here (no user auth; verified via the per-bot secret_token header).
@Controller("auto-reply/webhook")
export class AutoReplyWebhookController {
  constructor(private svc: AutoReplyService) {}

  @Post(":platform/:userId")
  handle(
    @Param("platform") platform: string,
    @Param("userId") userId: string,
    @Headers("x-telegram-bot-api-secret-token") secret: string | undefined,
    @Body() update: any,
  ) {
    return this.svc.handleWebhook(platform, userId, secret, update);
  }
}
