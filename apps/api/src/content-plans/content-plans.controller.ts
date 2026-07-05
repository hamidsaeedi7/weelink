import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContentPlansService } from './content-plans.service';
import { TelegramService } from './telegram.service';
import { CreateContentPlanDto, UpdateContentPlanDto } from './dto/content-plan.dto';

// ─── Public controller for Telegram webhook (no JWT) ─────────────────────────
@Controller('content-plans/telegram/webhook')
export class TelegramWebhookController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  handle(@Body() body: any) {
    return this.telegramService.handleWebhook(body);
  }
}

// ─── Main controller (JWT required) ──────────────────────────────────────────
@Controller('content-plans')
@UseGuards(JwtAuthGuard)
export class ContentPlansController {
  constructor(
    private readonly contentPlansService: ContentPlansService,
    private readonly telegramService: TelegramService,
  ) {}

  // ─── Content Plans CRUD ─────────────────────────────────────────────────

  /** GET /content-plans?month=X&year=X&view=month|quarter|halfyear|year */
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('view') view?: string,
  ) {
    return this.contentPlansService.findAll(user.id, { month, year, view });
  }

  /** POST /content-plans */
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateContentPlanDto) {
    return this.contentPlansService.create(user.id, dto);
  }

  // Telegram routes must come BEFORE :id to avoid route collision
  // ─── Telegram Bot ──────────────────────────────────────────────────────

  /** GET /content-plans/telegram/connect */
  @Get('telegram/connect')
  getTelegramConnect(@CurrentUser() user: any) {
    const token = this.telegramService.generateConnectToken(user.id);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'WeeLink_Bot';
    const connectUrl = `https://t.me/${botUsername}?start=${token}`;
    return { token, botUsername, connectUrl };
  }

  /** POST /content-plans/telegram/set-token  { botToken, chatId } */
  @Post('telegram/set-token')
  setTelegramToken(@CurrentUser() user: any, @Body() body: { botToken: string; chatId: string }) {
    return this.telegramService.saveToken(user.id, body.botToken, body.chatId);
  }

  /** DELETE /content-plans/telegram/disconnect */
  @Delete('telegram/disconnect')
  telegramDisconnect(@CurrentUser() user: any) {
    return this.telegramService.disconnect(user.id);
  }

  /** GET /content-plans/telegram/status */
  @Get('telegram/status')
  async telegramStatus(@CurrentUser() user: any) {
    const config = await this.telegramService.getChatId(user.id);
    return {
      connected: !!(config?.isActive),
      username: config?.username ?? null,
      chatId: config?.isActive ? config.chatId : null,
    };
  }

  // ─── Parameterized routes (must come AFTER named routes) ───────────────

  /** GET /content-plans/:id */
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contentPlansService.findOne(user.id, id);
  }

  /** PUT /content-plans/:id */
  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateContentPlanDto,
  ) {
    return this.contentPlansService.update(user.id, id, dto);
  }

  /** DELETE /content-plans/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contentPlansService.remove(user.id, id);
  }

  /** PUT /content-plans/:id/status */
  @Put(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.contentPlansService.updateStatus(user.id, id, status);
  }
}
