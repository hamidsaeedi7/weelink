import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "../payments/payments.service";
import { CouponsService } from "../coupons/coupons.service";
import { CreateDigitalFileDto, UpdateDigitalFileDto, PurchaseDigitalFileDto } from "./dto/digital-file.dto";

const API_URL = process.env.API_URL || "http://localhost:4000";

@Injectable()
export class DigitalFilesService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private coupons: CouponsService,
  ) {}

  private async getShopId(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop.id;
  }

  private serialize(f: any) {
    return { ...f, price: f.price?.toString() };
  }

  async create(userId: string, dto: CreateDigitalFileDto) {
    const shopId = await this.getShopId(userId);
    return this.serialize(
      await this.prisma.digitalFile.create({
        data: { shopId, ...dto, price: BigInt(dto.price ?? 0) },
      }),
    );
  }

  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    const files = await this.prisma.digitalFile.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
    });
    return files.map(this.serialize);
  }

  async findAllPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    const files = await this.prisma.digitalFile.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, description: true, coverUrl: true, price: true, isFree: true, downloadCount: true },
    });
    return files.map(this.serialize);
  }

  async update(userId: string, id: string, dto: UpdateDigitalFileDto) {
    const file = await this.prisma.digitalFile.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!file) throw new NotFoundException();
    if (file.shop.userId !== userId) throw new ForbiddenException();
    const data: any = { ...dto };
    if (dto.price !== undefined) data.price = BigInt(dto.price);
    return this.serialize(await this.prisma.digitalFile.update({ where: { id }, data }));
  }

  /** Seller-facing list of buyers who purchased any of their digital files. */
  async findPurchasesForOwner(userId: string) {
    const shopId = await this.getShopId(userId);
    const purchases = await this.prisma.digitalPurchase.findMany({
      where: { file: { shopId } },
      include: { file: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return purchases.map((p) => ({
      id: p.id,
      fileTitle: p.file.title,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      amountPaid: Number(p.amountPaid),
      paymentStatus: p.paymentStatus,
      couponCode: p.couponCode,
      createdAt: p.createdAt,
    }));
  }

  async remove(userId: string, id: string) {
    const file = await this.prisma.digitalFile.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!file) throw new NotFoundException();
    if (file.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.digitalFile.delete({ where: { id } });
    return { success: true };
  }

  /** Buyer-facing purchase — gateway-only (no card-to-card), requires name + phone. */
  async purchase(slug: string, fileId: string, dto: PurchaseDigitalFileDto) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    const file = await this.prisma.digitalFile.findUnique({ where: { id: fileId } });
    if (!file || file.shopId !== shop.id || !file.isActive) throw new NotFoundException("فایل یافت نشد");

    if (file.isFree || file.price <= 0n) {
      const purchase = await this.prisma.digitalPurchase.create({
        data: {
          fileId,
          customerName: dto.buyerName,
          customerPhone: dto.buyerPhone,
          amountPaid: 0n,
          paymentStatus: "PAID",
        },
      });
      return { free: true, downloadUrl: `${API_URL}/api/v1/digital-files/download/${purchase.downloadToken}` };
    }

    let finalPrice = Number(file.price);
    if (dto.couponCode) {
      const result = await this.coupons.validate({
        code: dto.couponCode,
        total: finalPrice,
        itemType: "DIGITAL_FILE",
        itemIds: [fileId],
      });
      finalPrice = Math.max(0, result.finalPrice);
    }

    const purchase = await this.prisma.digitalPurchase.create({
      data: {
        fileId,
        customerName: dto.buyerName,
        customerPhone: dto.buyerPhone,
        amountPaid: BigInt(finalPrice),
        paymentStatus: "UNPAID",
      },
    });

    if (finalPrice <= 0) {
      await this.prisma.digitalPurchase.update({ where: { id: purchase.id }, data: { paymentStatus: "PAID" } });
      if (dto.couponCode) await this.coupons.incrementUsage(dto.couponCode);
      return { free: true, downloadUrl: `${API_URL}/api/v1/digital-files/download/${purchase.downloadToken}` };
    }

    const { authority, gatewayUrl } = await this.payments.requestGatewayPayment({
      shopId: shop.id,
      type: "DIGITAL_FILE",
      refId: purchase.id,
      amount: finalPrice * 10, // Toman → Rial
      buyerName: dto.buyerName,
      buyerPhone: dto.buyerPhone,
      description: `خرید فایل: ${file.title}`,
      callbackUrl: `${API_URL}/api/v1/payments/gateway/callback`,
    });

    await this.prisma.digitalPurchase.update({
      where: { id: purchase.id },
      data: { paymentRef: authority, couponCode: dto.couponCode?.toUpperCase() },
    });
    return { free: false, gatewayUrl };
  }

  /** Called by the gateway callback once Zarinpal confirms payment. Idempotent. */
  async finalizePurchase(purchaseId: string) {
    const purchase = await this.prisma.digitalPurchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw new NotFoundException("خرید یافت نشد");
    if (purchase.paymentStatus !== "PAID") {
      await this.prisma.digitalPurchase.update({ where: { id: purchaseId }, data: { paymentStatus: "PAID" } });
      await this.prisma.digitalFile.update({ where: { id: purchase.fileId }, data: { downloadCount: { increment: 1 } } });
      if (purchase.couponCode) await this.coupons.incrementUsage(purchase.couponCode);
    }
    return { downloadUrl: `${API_URL}/api/v1/digital-files/download/${purchase.downloadToken}` };
  }

  /** Public download gate — only serves the file once payment is confirmed. */
  async getDownloadRedirect(token: string) {
    const purchase = await this.prisma.digitalPurchase.findUnique({
      where: { downloadToken: token },
      include: { file: true },
    });
    if (!purchase || purchase.paymentStatus !== "PAID") throw new BadRequestException("دسترسی نامعتبر یا پرداخت انجام نشده است");
    if (!purchase.downloadedAt) {
      await this.prisma.digitalPurchase.update({ where: { id: purchase.id }, data: { downloadedAt: new Date() } });
    }
    return purchase.file.fileUrl;
  }
}
