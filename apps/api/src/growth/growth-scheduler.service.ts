import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SmsService } from "../sms/sms.service";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 3;

@Injectable()
export class GrowthSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(GrowthSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  onModuleInit() {
    // Run hourly, plus once shortly after startup
    setInterval(() => this.tick(), 60 * 60 * 1000);
    setTimeout(() => this.tick(), 15000);
  }

  private async tick() {
    await this.downgradeExpiredPlans();
    await this.grantTrialReminders();
  }

  /**
   * Revert PRO users whose plan has expired back to FREE.
   * (Lifetime plans have planExpiresAt far in the future, so they are unaffected.)
   */
  async downgradeExpiredPlans() {
    try {
      const res = await this.prisma.user.updateMany({
        where: {
          plan: "PRO",
          planExpiresAt: { not: null, lt: new Date() },
        },
        data: { plan: "FREE" },
      });
      if (res.count > 0) this.logger.log(`Downgraded ${res.count} expired PRO user(s) to FREE`);
    } catch (err: any) {
      this.logger.error(`downgradeExpiredPlans failed: ${err?.message ?? err}`);
    }
  }

  /**
   * 7 days after signup, gift free users who have never subscribed a
   * 3-day PRO trial and let them know via SMS. The subscription record
   * (price 0) marks the trial as used so it is never granted twice, and
   * downgradeExpiredPlans() reverts them to FREE when the trial ends.
   */
  async grantTrialReminders() {
    try {
      const now = Date.now();
      const windowStart = new Date(now - 8 * DAY_MS);
      const windowEnd = new Date(now - 7 * DAY_MS);

      const candidates = await this.prisma.user.findMany({
        where: {
          plan: "FREE",
          phone: { not: null },
          createdAt: { gte: windowStart, lt: windowEnd },
          subscriptions: { none: {} }, // never paid or trialed before
        },
        select: { id: true, phone: true },
      });

      for (const user of candidates) {
        const expiresAt = new Date(now + TRIAL_DAYS * DAY_MS);
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: user.id },
            data: { plan: "PRO", planExpiresAt: expiresAt },
          }),
          this.prisma.subscription.create({
            data: { userId: user.id, plan: "PRO", duration: 0, price: BigInt(0), expiresAt },
          }),
        ]);

        const message =
          "🎁 هدیه ویلینک!\n" +
          "۳ روز اشتراک PRO رایگان برات فعال شد. همه‌ی امکانات حرفه‌ای رو امتحان کن:\n" +
          "weeelink.ir/dashboard";
        this.sms.sendSms(user.phone!, message).catch(() => {});
        this.logger.log(`Granted 3-day PRO trial to user ${user.id}`);
      }
    } catch (err: any) {
      this.logger.error(`grantTrialReminders failed: ${err?.message ?? err}`);
    }
  }
}
