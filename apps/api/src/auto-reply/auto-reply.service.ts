import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
// Free feature (matches public pricing page)

const SUPPORTED_PLATFORMS = ["telegram", "bale"];

function randomSecret() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

@Injectable()
export class AutoReplyService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    return this.prisma.autoReply.create({
      data: { userId, platform: dto.platform, keyword: dto.keyword, reply: dto.reply, isActive: dto.isActive ?? true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.autoReply.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async update(userId: string, id: string, dto: any) {
    const ar = await this.prisma.autoReply.findUnique({ where: { id } });
    if (!ar) throw new NotFoundException();
    if (ar.userId !== userId) throw new ForbiddenException();
    return this.prisma.autoReply.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const ar = await this.prisma.autoReply.findUnique({ where: { id } });
    if (!ar) throw new NotFoundException();
    if (ar.userId !== userId) throw new ForbiddenException();
    await this.prisma.autoReply.delete({ where: { id } });
    return { success: true };
  }

  // ─── Bot connection (telegram / bale) ──────────────────────────────────────

  private apiBase(platform: string) {
    if (platform === "telegram") return (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
    if (platform === "bale") return "https://tapi.bale.ai";
    throw new BadRequestException("پلتفرم پشتیبانی نمی‌شود");
  }

  private webhookUrl(platform: string, userId: string) {
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    return `${apiUrl}/api/v1/auto-reply/webhook/${platform}/${userId}`;
  }

  async listBots(userId: string) {
    const bots = await this.prisma.autoReplyBot.findMany({ where: { userId } });
    // Never expose the raw token/secret to the client.
    return bots.map((b) => ({ platform: b.platform, botUsername: b.botUsername, connectedAt: b.createdAt }));
  }

  async connectBot(userId: string, platform: string, botToken: string) {
    if (!SUPPORTED_PLATFORMS.includes(platform)) throw new BadRequestException("پلتفرم پشتیبانی نمی‌شود");
    if (!botToken?.trim()) throw new BadRequestException("توکن ربات الزامی است");

    const base = this.apiBase(platform);
    let me: any;
    try {
      const res = await fetch(`${base}/bot${botToken}/getMe`);
      me = await res.json();
    } catch {
      throw new BadRequestException("اتصال به سرور ربات برقرار نشد، دوباره تلاش کنید");
    }
    if (!me?.ok) throw new BadRequestException("توکن ربات نامعتبر است");

    const webhookSecret = randomSecret();
    try {
      const res = await fetch(`${base}/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: this.webhookUrl(platform, userId),
          secret_token: webhookSecret,
        }),
      });
      const d: any = await res.json();
      if (!d?.ok) throw new BadRequestException(d?.description || "ثبت وبهوک ناموفق بود");
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException("ثبت وبهوک ناموفق بود، دوباره تلاش کنید");
    }

    const botUsername = me.result?.username || null;
    await this.prisma.autoReplyBot.upsert({
      where: { userId_platform: { userId, platform } },
      update: { botToken, botUsername, webhookSecret },
      create: { userId, platform, botToken, botUsername, webhookSecret },
    });
    return { success: true, botUsername };
  }

  async disconnectBot(userId: string, platform: string) {
    const bot = await this.prisma.autoReplyBot.findUnique({ where: { userId_platform: { userId, platform } } });
    if (!bot) return { success: true };
    try {
      const base = this.apiBase(platform);
      await fetch(`${base}/bot${bot.botToken}/deleteWebhook`, { method: "POST" });
    } catch {
      // Best-effort — proceed to remove the local record even if the platform call fails
      // (matches this project's established fail-soft pattern for Telegram/Bale calls).
    }
    await this.prisma.autoReplyBot.delete({ where: { userId_platform: { userId, platform } } });
    return { success: true };
  }

  // ─── Incoming webhook (customer message → keyword match → auto reply) ─────

  async handleWebhook(platform: string, userId: string, secretHeader: string | undefined, update: any) {
    if (!SUPPORTED_PLATFORMS.includes(platform)) return { ok: true };
    const bot = await this.prisma.autoReplyBot.findUnique({ where: { userId_platform: { userId, platform } } });
    if (!bot || bot.webhookSecret !== secretHeader) return { ok: true }; // silently ignore unverified calls

    const text: string | undefined = update?.message?.text;
    const chatId = update?.message?.chat?.id;
    if (!text || chatId === undefined) return { ok: true };

    const rules = await this.prisma.autoReply.findMany({
      where: { userId, platform, isActive: true },
    });
    const matched = rules.find((r) => text.toLowerCase().includes(r.keyword.toLowerCase()));
    if (!matched) return { ok: true };

    try {
      const base = this.apiBase(platform);
      await fetch(`${base}/bot${bot.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: matched.reply }),
      });
      await this.prisma.autoReply.update({
        where: { id: matched.id },
        data: { triggerCount: { increment: 1 } },
      });
    } catch {
      // Fail soft — a delivery failure to Telegram/Bale must not surface as a webhook error
      // (the platform would otherwise retry-storm the endpoint).
    }
    return { ok: true };
  }
}
