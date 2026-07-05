import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentSchedulerService } from './scheduler.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private prisma: PrismaService,
    private scheduler: ContentSchedulerService,
  ) {}

  generateConnectToken(userId: string): string {
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64url');
  }

  parseConnectToken(token: string): string | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString();
      const [userId] = decoded.split(':');
      return userId || null;
    } catch {
      return null;
    }
  }

  async saveChatId(
    userId: string,
    chatId: string,
    username?: string,
  ) {
    return this.prisma.telegramConfig.upsert({
      where: { userId },
      update: { chatId, username: username ?? null, isActive: true },
      create: { userId, chatId, username: username ?? null, isActive: true },
    });
  }

  /**
   * Per-user bot: the user pastes their own bot token (from @BotFather) and their
   * numeric chat id (from @userinfobot). Reminders are then sent through their bot.
   * We don't call Telegram here (setWebhook/getUpdates are outbound-blocked on the
   * server); the token is validated lazily at send time by the scheduler.
   */
  async saveToken(userId: string, botToken: string, chatId: string) {
    const clean = botToken.trim();
    const cid = chatId.trim();
    return this.prisma.telegramConfig.upsert({
      where: { userId },
      update: { botToken: clean, chatId: cid, isActive: true },
      create: { userId, botToken: clean, chatId: cid, isActive: true },
    });
  }

  async getChatId(userId: string) {
    return this.prisma.telegramConfig.findUnique({ where: { userId } });
  }

  async disconnect(userId: string) {
    const config = await this.prisma.telegramConfig.findUnique({
      where: { userId },
    });
    if (!config) throw new NotFoundException('تلگرام متصل نیست');
    return this.prisma.telegramConfig.update({
      where: { userId },
      data: { isActive: false },
    });
  }

  async handleWebhook(body: any) {
    try {
      const message = body?.message;
      if (!message) return { ok: true };

      const text: string = message?.text ?? '';
      const chatId = String(message?.chat?.id ?? '');
      const username: string = message?.from?.username ?? '';

      if (text.startsWith('/start ')) {
        const token = text.split(' ')[1];
        const userId = this.parseConnectToken(token);

        if (userId) {
          await this.saveChatId(userId, chatId, username);
          await this.scheduler.sendTelegramMessage(
            chatId,
            '✅ ربات ویلینک متصل شد!\n\nاز این پس یادآوری‌های تقویم محتوای شما از طریق تلگرام ارسال می‌شود. 🎉',
          );
          this.logger.log(`Telegram connected for user ${userId}, chatId: ${chatId}`);
        } else {
          await this.scheduler.sendTelegramMessage(
            chatId,
            '❌ لینک اتصال معتبر نیست. لطفاً از پنل ویلینک دوباره امتحان کنید.',
          );
        }
      } else if (text === '/start') {
        await this.scheduler.sendTelegramMessage(
          chatId,
          '👋 سلام! برای اتصال این ربات به حساب ویلینک خود، از پنل کاربری لینک اتصال را دریافت کنید.',
        );
      }
    } catch (err: any) {
      this.logger.error(`Telegram webhook error: ${err?.message ?? err}`);
    }

    return { ok: true };
  }
}
