import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CouponsService } from "../coupons/coupons.service";
import { SmsService } from "../sms/sms.service";
import { PaymentsService } from "../payments/payments.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { OrderStatus } from "@prisma/client";

const API_URL = process.env.API_URL || "http://localhost:4000";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private coupons: CouponsService,
    private sms: SmsService,
    private payments: PaymentsService,
  ) {}

  async create(dto: CreateOrderDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: dto.shopSlug },
      select: { id: true, user: { select: { phone: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    const realItemIds = dto.items.map((i) => i.productId).filter((id) => id !== "custom");
    const products = realItemIds.length
      ? await this.prisma.product.findMany({ where: { id: { in: realItemIds }, shopId: shop.id } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Real cart checkout (has actual products) requires full shipping info + a single consistent payment method.
    let paymentMethod = "CARD_TO_CARD";
    if (realItemIds.length) {
      if (products.length !== realItemIds.length) throw new BadRequestException("برخی محصولات یافت نشدند");
      if (!dto.customerAddress || !dto.customerPostalCode) {
        throw new BadRequestException("آدرس و کد پستی الزامی است");
      }
      const methods = new Set(products.map((p) => p.paymentMethod));
      if (methods.size > 1) {
        throw new BadRequestException("محصولات این سبد روش پرداخت متفاوتی دارند — لطفاً جداگانه خرید کنید");
      }
      paymentMethod = products[0].paymentMethod;
    }

    // Server-side authoritative price for real products (never trust client-submitted price).
    const totalPrice = dto.items.reduce((s, i) => {
      const p = productMap.get(i.productId);
      const price = p ? Number(p.price) : i.price;
      return s + price * i.qty;
    }, 0);
    let discount = 0;

    if (dto.couponCode) {
      try {
        const result = await this.coupons.validate({ code: dto.couponCode, total: totalPrice });
        discount = result.discount;
      } catch {
        throw new BadRequestException("کد تخفیف معتبر نیست");
      }
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const order = await this.prisma.order.create({
      data: {
        shopId: shop.id,
        orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        customerPostalCode: dto.customerPostalCode,
        paymentMethod,
        items: dto.items as any,
        totalPrice: BigInt(totalPrice),
        discount: BigInt(discount),
        couponCode: dto.couponCode?.toUpperCase(),
        note: dto.note,
      },
    });

    if (paymentMethod === "GATEWAY" && totalPrice - discount > 0) {
      const { authority, gatewayUrl } = await this.payments.requestGatewayPayment({
        shopId: shop.id,
        type: "PRODUCT",
        refId: order.id,
        amount: (totalPrice - discount) * 10, // Toman → Rial
        buyerName: dto.customerName,
        buyerPhone: dto.customerPhone,
        description: `سفارش ${orderNumber}`,
        callbackUrl: `${API_URL}/api/v1/payments/gateway/callback`,
      });
      await this.prisma.order.update({ where: { id: order.id }, data: { paymentRef: authority } });
      return { ...this.serialize(order), paymentMethod, gatewayUrl };
    }

    let finalOrder = order;
    if (paymentMethod === "GATEWAY") {
      // fully covered by coupon — no gateway trip needed
      await this.finalizeOrder(order.id);
      finalOrder = await this.prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    }

    // Notify shop owner via SMS
    if (shop.user.phone) {
      this.sms.sendOtp(
        shop.user.phone,
        `سفارش جدید ${orderNumber}: ${totalPrice - discount} تومان`,
      ).catch(() => {});
    }

    return { ...this.serialize(finalOrder), paymentMethod };
  }

  /** Called by the gateway callback once Zarinpal confirms payment, or directly for free/coupon-covered orders. */
  async finalizeOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("سفارش یافت نشد");
    if (order.paymentStatus !== "PAID") {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
      if (order.couponCode) await this.coupons.incrementUsage(order.couponCode);
    }
    return { orderNumber: order.orderNumber };
  }

  /** Seller manually confirms a card-to-card bank transfer was received. */
  async markPaid(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { select: { userId: true } } },
    });
    if (!order) throw new NotFoundException();
    if (order.shop.userId !== userId) throw new ForbiddenException();
    if (order.paymentStatus === "PAID") return this.serialize(order);
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: order.status === "PENDING" ? "CONFIRMED" : order.status },
    });
    if (order.couponCode) await this.coupons.incrementUsage(order.couponCode);
    return this.serialize(updated);
  }

  async findAllForOwner(userId: string, page?: number, status?: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) return { orders: [], total: 0 };

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * 20,
        take: 20,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(this.serialize),
      total,
      page: safePage,
      pages: Math.ceil(total / 20),
    };
  }

  async updateStatus(userId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!order) throw new NotFoundException();
    if (order.shop.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
    });
    return this.serialize(updated);
  }

  private serialize(o: any) {
    return {
      ...o,
      totalPrice: Number(o.totalPrice),
      discount: Number(o.discount),
    };
  }
}
