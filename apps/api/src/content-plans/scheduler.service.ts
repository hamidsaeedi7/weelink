import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { EmailService } from '../email/email.service';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'اینستاگرام',
  telegram: 'تلگرام',
  youtube: 'یوتیوب',
  twitter: 'توییتر',
  other: 'سایر',
};

@Injectable()
export class ContentSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ContentSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private email: EmailService,
  ) {}

  onModuleInit() {
    // Check every hour
    setInterval(() => this.checkAndSendReminders(), 60 * 60 * 1000);
    // Also run shortly after startup
    setTimeout(() => this.checkAndSendReminders(), 5000);
  }

  async checkAndSendReminders() {
    this.logger.log('Checking content plan reminders...');
    const now = new Date();

    try {
      const plansToNotify = await this.prisma.contentPlan.findMany({
        where: {
          status: 'PLANNED',
          scheduledAt: { gte: now }, // future plans only
        },
        include: {
          shop: {
            include: {
              user: {
                include: { telegramConfig: true },
              },
            },
          },
        },
      });

      for (const plan of plansToNotify) {
        for (const hoursX of plan.notifyBefore) {
          if (plan.remindersSent.includes(hoursX)) continue;

          const triggerTime = new Date(
            plan.scheduledAt.getTime() - hoursX * 60 * 60 * 1000,
          );
          const diff = Math.abs(now.getTime() - triggerTime.getTime());

          if (diff <= 30 * 60 * 1000) {
            // within 30 minute window
            await this.sendReminder(plan, hoursX);
            await this.prisma.contentPlan.update({
              where: { id: plan.id },
              data: { remindersSent: { push: hoursX } },
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error checking reminders: ${err?.message ?? err}`);
    }
  }

  private async sendReminder(plan: any, hoursX: number) {
    const user = plan.shop.user;

    // Convert scheduledAt to Jalali for display
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jalaali = require('jalaali-js');
    const d = new Date(plan.scheduledAt);
    const jalaliDate = jalaali.toJalaali(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
    );
    const dateStr = `${jalaliDate.jy}/${String(jalaliDate.jm).padStart(2, '0')}/${String(jalaliDate.jd).padStart(2, '0')}`;
    const timeStr = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const hoursLabel =
      hoursX >= 24 ? `${hoursX / 24} روز` : `${hoursX} ساعت`;
    const message =
      `⏰ یادآوری محتوا — ویلینک\n\n` +
      `📝 ${plan.title}\n` +
      `📅 تاریخ: ${dateStr} ساعت ${timeStr}\n` +
      `📱 پلتفرم: ${PLATFORM_LABELS[plan.platform] || plan.platform}\n` +
      `⏳ ${hoursLabel} دیگه\n\n` +
      `—\n🔗 weeelink.com`;

    if (plan.notifyViaSms && user.phone) {
      try {
        await this.sms.sendSms(user.phone, message);
      } catch (err: any) {
        this.logger.warn(`SMS reminder failed: ${err?.message}`);
      }
    }

    if (plan.notifyViaEmail && user.email) {
      try {
        const html = message.replace(/\n/g, '<br>');
        await this.email.sendRaw(user.email, `یادآوری: ${plan.title}`, html);
      } catch (err: any) {
        this.logger.warn(`Email reminder failed: ${err?.message}`);
      }
    }

    if (
      plan.notifyViaTelegram &&
      user.telegramConfig?.isActive &&
      user.telegramConfig?.chatId
    ) {
      try {
        await this.sendTelegramMessage(user.telegramConfig.chatId, message);
      } catch (err: any) {
        this.logger.warn(`Telegram reminder failed: ${err?.message}`);
      }
    }

    this.logger.log(
      `Reminder sent for plan "${plan.title}" (${hoursX}h before) to user ${user.id}`,
    );
  }

  async sendTelegramMessage(chatId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured — skipping Telegram message');
      return;
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  }
}
