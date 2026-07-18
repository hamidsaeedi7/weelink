import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../prisma/prisma.service";

const ZIBAL_BASE = "https://gateway.zibal.ir/v1";
const ZIBAL_GATEWAY = "https://gateway.zibal.ir/start";

const PLATFORM_FEE_PERCENT = 10n;

interface RequestGatewayPaymentInput {
  shopId: string;
  type: "DIGITAL_FILE" | "COURSE" | "PRODUCT";
  refId?: string;
  amount: number; // Rial
  buyerName?: string;
  buyerPhone?: string;
  description: string;
  callbackUrl: string;
}

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
    private prisma: PrismaService,
  ) {
    this.merchantId = this.config.get<string>("ZIBAL_MERCHANT_ID") || "";
  }

  /** Live-reads the Zibal merchant config from SiteSettings (no cache, no restart needed —
   *  as soon as an admin saves it in /modir/settings the gateway starts working). Falls back
   *  to the ZIBAL_MERCHANT_ID env var so nothing breaks before the first admin save.
   *  Shared by both the PRO-plan flow and the buyer marketplace flow — one merchant, two
   *  separate ledgers (Subscription vs GatewayTransaction) so admin reporting stays split. */
  private async getZibalConfig(): Promise<{ merchantId: string }> {
    const settings = await this.prisma.siteSettings.findUnique({ where: { id: "default" } });
    const zibal = (settings?.paymentConfig as any)?.zibal || {};
    return { merchantId: zibal.merchantId || this.merchantId };
  }

  async requestGatewayPayment(input: RequestGatewayPaymentInput) {
    const { merchantId } = await this.getZibalConfig();
    if (!merchantId) {
      throw new BadRequestException("درگاه پرداخت ویلینک هنوز توسط مدیریت پیکربندی نشده است");
    }
    if (input.amount <= 0) throw new BadRequestException("مبلغ نامعتبر است");

    const res = await fetch(`${ZIBAL_BASE}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: merchantId,
        amount: input.amount,
        callbackUrl: input.callbackUrl,
        description: input.description,
      }),
    });

    const data: any = await res.json();
    if (data?.result !== 100) {
      this.logger.error(`Zibal request failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(`خطا در اتصال به درگاه زیبال: کد ${data?.result}`);
    }

    const trackId = String(data.trackId);
    const amount = BigInt(input.amount);
    const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100n;
    const sellerPayable = amount - platformFee;

    await this.prisma.gatewayTransaction.create({
      data: {
        shopId: input.shopId,
        type: input.type,
        refId: input.refId,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        amount,
        platformFee,
        sellerPayable,
        authority: trackId,
        status: "PENDING",
      },
    });

    return { authority: trackId, gatewayUrl: `${ZIBAL_GATEWAY}/${trackId}` };
  }

  async verifyGatewayPayment(trackId: string, success: string) {
    if (!trackId) throw new BadRequestException("اطلاعات تراکنش ناقص است");

    const txn = await this.prisma.gatewayTransaction.findUnique({ where: { authority: trackId } });
    if (!txn) throw new NotFoundException("تراکنش یافت نشد");

    if (txn.status === "PAID") {
      return { success: true, refNumber: txn.refNumber, shopId: txn.shopId, type: txn.type, refId: txn.refId, alreadyVerified: true };
    }

    if (success !== "1") {
      await this.prisma.gatewayTransaction.update({ where: { authority: trackId }, data: { status: "FAILED" } });
      throw new BadRequestException("پرداخت توسط کاربر لغو شد");
    }

    const { merchantId } = await this.getZibalConfig();
    const res = await fetch(`${ZIBAL_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: merchantId, trackId: Number(trackId) }),
    });

    const data: any = await res.json();
    // 100 = success, 201 = already verified (idempotent)
    if (data?.result !== 100 && data?.result !== 201) {
      this.logger.error(`Zibal verify failed for ${trackId}: ${JSON.stringify(data)}`);
      await this.prisma.gatewayTransaction.update({ where: { authority: trackId }, data: { status: "FAILED" } });
      throw new BadRequestException(`تأیید پرداخت ناموفق: کد ${data?.result}`);
    }

    const refNumber = String(data.refNumber ?? trackId);
    await this.prisma.gatewayTransaction.update({
      where: { authority: trackId },
      data: { status: "PAID", refNumber },
    });

    return { success: true, refNumber, shopId: txn.shopId, type: txn.type, refId: txn.refId };
  }

  async requestPlanPayment(userId: string, months: number, callbackUrl: string) {
    const price = PRO_PLAN_PRICES[months];
    if (!price) throw new BadRequestException("مدت زمان پلن نامعتبر است");

    const { merchantId } = await this.getZibalConfig();
    if (!merchantId) {
      throw new BadRequestException("درگاه پرداخت ویلینک هنوز توسط مدیریت پیکربندی نشده است");
    }

    const res = await fetch(`${ZIBAL_BASE}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: merchantId,
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

    const { merchantId } = await this.getZibalConfig();
    const res = await fetch(`${ZIBAL_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: merchantId, trackId: Number(trackId) }),
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
