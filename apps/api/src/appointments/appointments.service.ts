import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop.id;
  }

  private serializeService(s: any) {
    return { ...s, price: s.price?.toString() };
  }

  // Services
  async createService(userId: string, dto: any) {
    const shopId = await this.getShopId(userId);
    return this.serializeService(
      await this.prisma.appointmentService.create({
        data: { shopId, ...dto, price: BigInt(dto.price ?? 0) },
      }),
    );
  }

  async getServices(userId: string) {
    const shopId = await this.getShopId(userId);
    const services = await this.prisma.appointmentService.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { appointments: true } } },
    });
    return services.map(this.serializeService);
  }

  async getServicesPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    const services = await this.prisma.appointmentService.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return services.map(this.serializeService);
  }

  async updateService(userId: string, id: string, dto: any) {
    const svc = await this.prisma.appointmentService.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!svc) throw new NotFoundException();
    if (svc.shop.userId !== userId) throw new ForbiddenException();
    const data: any = { ...dto };
    if (dto.price !== undefined) data.price = BigInt(dto.price);
    return this.serializeService(await this.prisma.appointmentService.update({ where: { id }, data }));
  }

  async removeService(userId: string, id: string) {
    const svc = await this.prisma.appointmentService.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!svc) throw new NotFoundException();
    if (svc.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.appointmentService.delete({ where: { id } });
    return { success: true };
  }

  // Bookings
  async getBookings(userId: string) {
    const shopId = await this.getShopId(userId);
    const services = await this.prisma.appointmentService.findMany({
      where: { shopId },
      select: { id: true },
    });
    const serviceIds = services.map((s) => s.id);
    return this.prisma.appointment.findMany({
      where: { serviceId: { in: serviceIds } },
      include: { service: { select: { name: true, color: true, durationMins: true } } },
      orderBy: { date: "desc" },
    });
  }

  async updateBooking(userId: string, id: string, dto: any) {
    const booking = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: { include: { shop: { select: { userId: true } } } } },
    });
    if (!booking) throw new NotFoundException();
    if (booking.service.shop.userId !== userId) throw new ForbiddenException();
    return this.prisma.appointment.update({ where: { id }, data: dto });
  }

  // Public booking creation
  async createBooking(dto: any) {
    const svc = await this.prisma.appointmentService.findUnique({ where: { id: dto.serviceId } });
    if (!svc || !svc.isActive) throw new NotFoundException("سرویس یافت نشد");
    return this.prisma.appointment.create({
      data: {
        serviceId: dto.serviceId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        date: new Date(dto.date),
        note: dto.note,
      },
    });
  }
}
