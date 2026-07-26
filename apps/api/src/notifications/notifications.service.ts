import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findMine(userId: string, plan: string) {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { isGlobal: true, OR: [{ targetPlan: null }, { targetPlan: plan }] },
        ],
      },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 30,
    });
  }

  /**
   * `isRead` lives on the Notification row itself — correct for a
   * user-targeted row (single recipient), but a global/broadcast row is
   * shared across every recipient, so flipping it there would mark the
   * announcement read for everyone. For global rows this is a no-op on the
   * server; the client tracks its own "seen" state for those instead.
   */
  async markRead(userId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) return { success: true };
    if (notif.userId === userId) {
      await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    }
    return { success: true };
  }
}
