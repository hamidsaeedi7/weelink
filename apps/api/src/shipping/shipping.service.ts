import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AddTrackingDto {
  carrier: string;
  trackingCode: string;
  estimatedDelivery?: string;
}

export interface AddTrackingUpdateDto {
  status: string;
  note?: string;
  location?: string;
}

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  private async findOrderForOwner(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { select: { userId: true, name: true, slug: true } } },
    });
    if (!order) throw new NotFoundException("سفارش یافت نشد");
    if (order.shop.userId !== userId) throw new ForbiddenException("دسترسی غیرمجاز");
    return order;
  }

  async addTracking(userId: string, orderId: string, dto: AddTrackingDto) {
    await this.findOrderForOwner(orderId, userId);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        carrier: dto.carrier,
        trackingCode: dto.trackingCode,
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
        trackingHistory: {
          push: {
            status: "SHIPPED",
            note: `ارسال با ${dto.carrier} — کد رهگیری: ${dto.trackingCode}`,
            location: null,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    return this.serializeOrder(updated);
  }

  async getTracking(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { select: { name: true, slug: true } } },
    });
    if (!order) throw new NotFoundException("سفارش یافت نشد");

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      shopName: order.shop.name,
      shopSlug: order.shop.slug,
      carrier: (order as any).carrier ?? null,
      trackingCode: (order as any).trackingCode ?? null,
      estimatedDelivery: (order as any).estimatedDelivery ?? null,
      trackingHistory: Array.isArray((order as any).trackingHistory)
        ? (order as any).trackingHistory
        : [],
    };
  }

  async addTrackingUpdate(userId: string, orderId: string, dto: AddTrackingUpdateDto) {
    await this.findOrderForOwner(orderId, userId);

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    const existing: any[] = Array.isArray((order as any).trackingHistory)
      ? (order as any).trackingHistory
      : [];

    const newEntry = {
      status: dto.status,
      note: dto.note ?? "",
      location: dto.location ?? null,
      timestamp: new Date().toISOString(),
    };

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        trackingHistory: [...existing, newEntry],
      },
    });

    return this.serializeOrder(updated);
  }

  async getTrackingHistory(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("سفارش یافت نشد");
    return Array.isArray((order as any).trackingHistory) ? (order as any).trackingHistory : [];
  }

  private serializeOrder(o: any) {
    return {
      ...o,
      totalPrice: Number(o.totalPrice),
      discount: Number(o.discount),
    };
  }
}
