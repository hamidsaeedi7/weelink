import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";
import { UsersService } from "../users/users.service";

const ZIBAL_BASE = "https://gateway.zibal.ir/v1";
const ZIBAL_GATEWAY = "https://gateway.zibal.ir/start";

/** Server-side source of truth for PRO plan pricing (tomans). Must match apps/web plan durations. */
const PRO_PLAN_PRICES: Record<number, number> = {
  1: 199000,
  3: 499000,
  6: 899000,
  12: 1599000,
  999: 4999000, // lifetime
};

const REDIS_TTL_SECONDS = 3600;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly merchantId: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private users: UsersService,
  ) {
    this.merchantId = this.config.get<string>("ZIBAL_MERCHANT_ID") || "";
  }

  async requestPlanPayment(userId: string, months: number, callbackUrl: string) {
    const price = PRO_PLAN_PRICES[months];
    if (!price) throw new BadRequestException("مدت زمان پلن نامعتبر است");

    const res = await fetch(`${ZIBAL_BASE}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: this.merchantId,
        // Zibal expects the amount in Rial; our plan prices are stored in Toman.
        amount: price * 10,
        callbackUrl,
        description: `ارتقا پلن PRO ویلینک - ${months} ماه`,
      }),
    });

    const data: any = await res.json();
    if (data?.result !== 100) {
      this.logger.error(`Zibal request failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(`خطا در اتصال به درگاه زیبال: کد ${data?.result}`);
    }

    const trackId = String(data.trackId);
    await this.redis.set(`zibal:plan:${trackId}`, JSON.stringify({ userId, months, price }), REDIS_TTL_SECONDS);

    return { trackId, gatewayUrl: `${ZIBAL_GATEWAY}/${trackId}` };
  }

  async verifyPlanPayment(trackId: string, success: string) {
    if (!trackId) throw new BadRequestException("اطلاعات تراکنش ناقص است");

    const raw = await this.redis.get(`zibal:plan:${trackId}`);
    if (!raw) throw new BadRequestException("تراکنش یافت نشد یا منقضی شده است");

    const { userId, months, price } = JSON.parse(raw) as { userId: string; months: number; price: number };

    if (success !== "1") {
      await this.redis.del(`zibal:plan:${trackId}`);
      throw new BadRequestException("پرداخت توسط کاربر لغو شد");
    }

    const res = await fetch(`${ZIBAL_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: this.merchantId, trackId: Number(trackId) }),
    });

    const data: any = await res.json();
    // 100 = success, 201 = already verified (retry-safe, don't double-credit — Redis key removal below prevents that)
    if (data.result !== 100 && data.result !== 201) {
      this.logger.error(`Zibal verify failed for ${trackId}: ${JSON.stringify(data)}`);
      await this.redis.del(`zibal:plan:${trackId}`);
      throw new BadRequestException(`تأیید پرداخت ناموفق: کد ${data.result}`);
    }

    await this.redis.del(`zibal:plan:${trackId}`);

    const refId = String(data.refNumber || trackId);
    const result = await this.users.upgradePlan(userId, months, price, refId);
    return { ...result, refId };
  }
}
