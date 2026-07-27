import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BaleService {
  private readonly logger = new Logger(BaleService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Per-user bot: the user pastes their own bot token (from @BotFather-equivalent
   * on Bale) and their numeric chat id. Messages are then sent through their bot.
   */
  async saveToken(userId: string, botToken: string, chatId: string) {
    const clean = botToken.trim();
    const cid = chatId.trim();
    return this.prisma.baleConfig.upsert({
      where: { userId },
      update: { botToken: clean, chatId: cid, isActive: true },
      create: { userId, botToken: clean, chatId: cid, isActive: true },
    });
  }

  async getChatId(userId: string) {
    return this.prisma.baleConfig.findUnique({ where: { userId } });
  }

  async disconnect(userId: string) {
    const config = await this.prisma.baleConfig.findUnique({ where: { userId } });
    if (!config) throw new NotFoundException('بله متصل نیست');
    return this.prisma.baleConfig.update({ where: { userId }, data: { isActive: false } });
  }

  /** Sends a Bale message via the given bot token. Fails soft on timeout/error. */
  async sendBaleMessage(chatId: string, text: string, botToken?: string | null) {
    const token = botToken || process.env.BALE_BOT_TOKEN;
    if (!token) {
      this.logger.warn('No Bale bot token — skipping Bale message');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: controller.signal,
      });
    } catch (err: any) {
      this.logger.warn(`Bale message failed: ${err?.message ?? err}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
