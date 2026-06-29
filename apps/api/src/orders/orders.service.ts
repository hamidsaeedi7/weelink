import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CouponsService } from "../coupons/coupons.service";
import { SmsService } from "../sms/sms.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private coupons: CouponsService,
    private sms: SmsService,
  ) {}

  async create(dto: CreateOrderDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug: dto.shopSlug },
      select: { id: true, user: { select: { phone: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    const totalPrice = dto.items.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;

    if (dto.couponCode) {
      try {
        const result = await this.coupons.validate({ code: dto.couponCode, total: totalPrice });
        discount = result.discount;
        await this.prisma.coupon.update({
          where: { code: dto.couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
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
        items: dto.items as any,
        totalPrice: BigInt(totalPrice),
        discount: BigInt(discount),
        couponCode: dto.couponCode?.toUpperCase(),
        note: dto.note,
      },
    });

    // Notify shop owner via SMS
    if (shop.user.phone) {
      this.sms.sendOtp(
        shop.user.phone,
        `سفارش جدید ${orderNumber}: ${totalPrice - discount} تومان`,
      ).catch(() => {});
    }

    return { ...order, totalPrice: Number(order.totalPrice), discount: Number(order.discount) };
  }

  async findAllForOwner(userId: string, page = 1, status?: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) return { orders: [], total: 0 };

    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(this.serialize),
      total,
      page,
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

  async updatePayment(orderNumber: string, paymentRef: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException();
    return this.serialize(
      await this.prisma.order.update({
        where: { orderNumber },
        data: { paymentStatus: "PAID", paymentRef, status: "CONFIRMED" },
      }),
    );
  }

  private serialize(o: any) {
    return {
      ...o,
      totalPrice: Number(o.totalPrice),
      discount: Number(o.discount),
    };
  }
}
