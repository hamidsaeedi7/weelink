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

  /** Live-reads the Zarinpal merchant config from SiteSettings (no cache, no restart needed —
   *  as soon as an admin saves it in /modir/settings the gateway starts working). */
  private async getZarinpalConfig(): Promise<{ merchantId: string; sandbox: boolean }> {
    const settings = await this.prisma.siteSettings.findUnique({ where: { id: "default" } });
    const zarinpal = (settings?.paymentConfig as any)?.zarinpal || {};
    return { merchantId: zarinpal.merchantId || "", sandbox: !!zarinpal.sandbox };
  }

  async requestGatewayPayment(input: RequestGatewayPaymentInput) {
    const { merchantId, sandbox } = await this.getZarinpalConfig();
    if (!merchantId) {
      throw new BadRequestException("درگاه پرداخت ویلینک هنوز توسط مدیریت پیکربندی نشده است");
    }
    if (input.amount <= 0) throw new BadRequestException("مبلغ نامعتبر است");

    const base = sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
    const res = await fetch(`${base}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: input.amount,
        callback_url: input.callbackUrl,
        description: input.description,
        metadata: { mobile: input.buyerPhone, name: input.buyerName },
      }),
    });

    const data: any = await res.json();
    if (data?.data?.code !== 100) {
      this.logger.error(`Zarinpal request failed: ${JSON.stringify(data)}`);
      const msg = data?.errors?.message || `کد ${data?.errors?.code ?? data?.data?.code}`;
      throw new BadRequestException(`خطا در اتصال به درگاه ویلینک: ${msg}`);
    }

    const authority = data.data.authority as string;
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
        authority,
        status: "PENDING",
      },
    });

    const gatewayUrl = `${base}/pg/StartPay/${authority}`;
    return { authority, gatewayUrl };
  }

  async verifyGatewayPayment(authority: string, status: string) {
    if (!authority) throw new BadRequestException("اطلاعات تراکنش ناقص است");

    const txn = await this.prisma.gatewayTransaction.findUnique({ where: { authority } });
    if (!txn) throw new NotFoundException("تراکنش یافت نشد");

    if (txn.status === "PAID") {
      return { success: true, refNumber: txn.refNumber, shopId: txn.shopId, type: txn.type, refId: txn.refId, alreadyVerified: true };
    }

    if (status !== "OK") {
      await this.prisma.gatewayTransaction.update({ where: { authority }, data: { status: "FAILED" } });
      throw new BadRequestException("پرداخت توسط کاربر لغو شد");
    }

    const { merchantId, sandbox } = await this.getZarinpalConfig();
    const base = sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
    const res = await fetch(`${base}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, amount: Number(txn.amount), authority }),
    });

    const data: any = await res.json();
    // 100 = success, 101 = already verified (idempotent)
    if (data?.data?.code !== 100 && data?.data?.code !== 101) {
      this.logger.error(`Zarinpal verify failed for ${authority}: ${JSON.stringify(data)}`);
      await this.prisma.gatewayTransaction.update({ where: { authority }, data: { status: "FAILED" } });
      const msg = data?.errors?.message || `کد ${data?.errors?.code ?? data?.data?.code}`;
      throw new BadRequestException(`تأیید پرداخت ناموفق: ${msg}`);
    }

    const refNumber = String(data.data.ref_id ?? authority);
    await this.prisma.gatewayTransaction.update({
      where: { authority },
      data: { status: "PAID", refNumber },
    });

    return { success: true, refNumber, shopId: txn.shopId, type: txn.type, refId: txn.refId };
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
