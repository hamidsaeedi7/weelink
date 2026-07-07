import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { CreateServiceDto, UpdateServiceDto, UpdateBookingDto } from "./dto/service.dto";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";

const WINDOW_DAYS: Record<string, number> = { DAILY: 1, WEEKLY: 7, MONTHLY: 30 };

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
  async createService(userId: string, dto: CreateServiceDto) {
    // نوبت‌دهی آنلاین ویژگی پرو است
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan !== "PRO") throw new ProRequiredException();
    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException("ساعت پایان باید بعد از ساعت شروع باشد");
    }
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

  async updateService(userId: string, id: string, dto: UpdateServiceDto) {
    const svc = await this.prisma.appointmentService.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!svc) throw new NotFoundException();
    if (svc.shop.userId !== userId) throw new ForbiddenException();
    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException("ساعت پایان باید بعد از ساعت شروع باشد");
    }
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

  // ─── Slots ──────────────────────────────────────────────────────────────────

  /** Builds the list of {time, available} slots for a service on a given calendar day. */
  private buildDaySlots(svc: any, dateStr: string, takenTimes: Set<string>) {
    const workDays: number[] = Array.isArray(svc.workDays) ? svc.workDays : [0, 1, 2, 3, 4, 5, 6];
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayDate = new Date(y, (m || 1) - 1, d || 1);
    if (!workDays.includes(dayDate.getDay())) return [];

    const [sh, sm] = (svc.startTime || "09:00").split(":").map(Number);
    const [eh, em] = (svc.endTime || "18:00").split(":").map(Number);
    const step = svc.slotMinutes || 30;

    const slots: { time: string; available: boolean }[] = [];
    let cursor = sh * 60 + sm;
    const end = eh * 60 + em;
    const now = new Date();
    const isToday = dayDate.toDateString() === now.toDateString();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    while (cursor + step <= end) {
      const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
      const mm = String(cursor % 60).padStart(2, "0");
      const time = `${hh}:${mm}`;
      const inPast = isToday && cursor <= nowMinutes;
      slots.push({ time, available: !takenTimes.has(time) && !inPast });
      cursor += step;
    }
    return slots;
  }

  private assertWithinBookingWindow(svc: any, dateStr: string) {
    const windowDays = WINDOW_DAYS[svc.bookingWindow] ?? 7;
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, (m || 1) - 1, d || 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0 || diffDays >= windowDays) {
      throw new BadRequestException("این تاریخ خارج از بازهٔ نوبت‌دهی است");
    }
  }

  /** Public: available/taken slots for a service on a date (no customer info exposed). */
  async getSlotsPublic(slug: string, serviceId: string, dateStr: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    const svc = await this.prisma.appointmentService.findUnique({ where: { id: serviceId } });
    if (!svc || !svc.isActive || svc.shopId !== shop.id) throw new NotFoundException("سرویس یافت نشد");
    this.assertWithinBookingWindow(svc, dateStr);

    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999`);
    const booked = await this.prisma.appointment.findMany({
      where: { serviceId, date: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } },
      select: { date: true },
    });
    const taken = new Set(booked.map((b) => {
      const d = new Date(b.date);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }));
    return { date: dateStr, slotMinutes: svc.slotMinutes, slots: this.buildDaySlots(svc, dateStr, taken) };
  }

  /** Owner (dashboard): same slots but booked ones include the customer's info. */
  async getSlotsForOwner(userId: string, serviceId: string, dateStr: string) {
    const svc = await this.prisma.appointmentService.findUnique({
      where: { id: serviceId },
      include: { shop: { select: { userId: true } } },
    });
    if (!svc) throw new NotFoundException();
    if (svc.shop.userId !== userId) throw new ForbiddenException();

    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999`);
    const booked = await this.prisma.appointment.findMany({
      where: { serviceId, date: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } },
    });
    const byTime = new Map<string, any>();
    for (const b of booked) {
      const d = new Date(b.date);
      byTime.set(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`, b);
    }
    const slots = this.buildDaySlots(svc, dateStr, new Set(byTime.keys())).map((s) => ({
      ...s,
      booking: byTime.get(s.time)
        ? {
            id: byTime.get(s.time).id,
            customerName: byTime.get(s.time).customerName,
            customerPhone: byTime.get(s.time).customerPhone,
            status: byTime.get(s.time).status,
          }
        : null,
    }));
    return { date: dateStr, slotMinutes: svc.slotMinutes, slots };
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

  async updateBooking(userId: string, id: string, dto: UpdateBookingDto) {
    const booking = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: { include: { shop: { select: { userId: true } } } } },
    });
    if (!booking) throw new NotFoundException();
    if (booking.service.shop.userId !== userId) throw new ForbiddenException();
    return this.prisma.appointment.update({ where: { id }, data: dto });
  }

  // Public booking creation
  async createBooking(dto: CreateBookingDto) {
    const svc = await this.prisma.appointmentService.findUnique({ where: { id: dto.serviceId } });
    if (!svc || !svc.isActive) throw new NotFoundException("سرویس یافت نشد");

    const date = new Date(dto.date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    this.assertWithinBookingWindow(svc, dateStr);

    // Re-check the slot is still free right before inserting (best-effort race guard;
    // a unique DB constraint isn't used here so cancelled bookings can free the slot).
    const conflict = await this.prisma.appointment.findFirst({
      where: { serviceId: dto.serviceId, date, status: { not: "CANCELLED" } },
    });
    if (conflict) throw new ConflictException("این زمان همین الان توسط شخص دیگری رزرو شد. لطفاً زمان دیگری انتخاب کنید");

    return this.prisma.appointment.create({
      data: {
        serviceId: dto.serviceId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        date,
        note: dto.note,
      },
    });
  }
}
