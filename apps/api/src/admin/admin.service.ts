import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import * as os from "os";
import { UpdateUserDto, CreateGlobalCouponDto, SendNotificationDto, ChangeAdminCredentialsDto } from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const since30 = new Date(Date.now() - 30 * 86400000);
    const since7  = new Date(Date.now() - 7 * 86400000);

    const [
      totalUsers, newUsers7d, proUsers,
      totalShops, totalOrders, totalRevenue,
      openTickets, totalBlogPosts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      this.prisma.user.count({ where: { plan: "PRO" } }),
      this.prisma.shop.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalPrice: true }, where: { paymentStatus: "PAID" } }),
      this.prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      this.prisma.blogPost.count({ where: { isPublished: true } }),
    ]);

    const dailySignups = await this.getDailySignups(since30);

    return {
      users: { total: totalUsers, new7d: newUsers7d, pro: proUsers },
      shops: totalShops,
      orders: totalOrders,
      revenue: Number(totalRevenue._sum.totalPrice || 0),
      openTickets,
      blogPosts: totalBlogPosts,
      dailySignups,
    };
  }

  private async getDailySignups(since: Date) {
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const buckets: Record<string, number> = {};
    const days = Math.ceil((Date.now() - since.getTime()) / 86400000);
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (buckets[key] !== undefined) buckets[key]++;
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async getUsers(page: number = 1, limit = 20, search?: string, plan?: string) {
    page = Math.max(1, Number(page) || 1);
    const where: any = {};
    if (search) where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
    if (plan) where.plan = plan;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, phone: true, plan: true, planExpiresAt: true,
          isVerified: true, isBlocked: true, role: true, createdAt: true, lastLoginAt: true,
          shop: { select: { slug: true, name: true } },
          _count: { select: { tickets: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        shop: { include: { _count: { select: { blocks: true, products: true, orders: true } } } },
        tickets: { orderBy: { createdAt: "desc" }, take: 5 },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async updateUser(adminId: string, id: string, data: UpdateUserDto) {
    const update: any = {};
    if (data.plan !== undefined) update.plan = data.plan;
    if (data.isBlocked !== undefined) update.isBlocked = data.isBlocked;
    if (data.role !== undefined) update.role = data.role;
    if (data.planExpiresAt !== undefined) update.planExpiresAt = new Date(data.planExpiresAt);

    const updated = await this.prisma.user.update({ where: { id }, data: update });
    await this.prisma.adminLog.create({
      data: { adminId, action: "UPDATE_USER", target: id, data: { ...data } },
    });
    return updated;
  }

  async deleteUser(adminId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true, phone: true } });
    if (!user) throw new NotFoundException("کاربر یافت نشد");
    await this.prisma.user.delete({ where: { id } });
    await this.prisma.adminLog.create({
      data: { adminId, action: "DELETE_USER", target: id, data: { email: user.email, phone: user.phone } },
    });
    return { success: true };
  }

  async getActiveUsers() {
    const since = new Date(Date.now() - 24 * 3600000);
    return this.prisma.user.findMany({
      where: { lastLoginAt: { gte: since } },
      orderBy: { lastLoginAt: "desc" },
      take: 100,
      select: { id: true, email: true, phone: true, plan: true, lastLoginAt: true,
                shop: { select: { slug: true } } },
    });
  }

  // ─── Finance ──────────────────────────────────────────────────────────────

  async getFinance(page: number = 1) {
    page = Math.max(1, Number(page) || 1);
    const [orders, subscriptions, stats] = await Promise.all([
      this.prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
        include: { shop: { select: { slug: true, name: true } } },
      }),
      this.prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { email: true, phone: true } } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalPrice: true },
        _count: { id: true },
        where: { paymentStatus: "PAID" },
      }),
    ]);
    return {
      orders: orders.map((o) => ({ ...o, totalPrice: Number(o.totalPrice), discount: Number(o.discount) })),
      subscriptions: subscriptions.map((s) => ({ ...s, price: Number(s.price) })),
      totalRevenue: Number(stats._sum.totalPrice || 0),
      totalOrders: stats._count.id,
    };
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async getAllTickets(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.ticket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { email: true, phone: true } },
        replies: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  async adminReplyTicket(adminId: string, ticketId: string, message: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException();
    const [reply] = await Promise.all([
      this.prisma.ticketReply.create({
        data: { ticketId, authorId: adminId, isAdmin: true, message },
      }),
      this.prisma.ticket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } }),
    ]);
    return reply;
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return this.prisma.ticket.update({ where: { id: ticketId }, data: { status: status as any } });
  }

  // ─── Blog ─────────────────────────────────────────────────────────────────

  async getBlogPosts(page: number = 1) {
    page = Math.max(1, Number(page) || 1);
    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20, take: 20,
        include: { author: { select: { email: true } } },
      }),
      this.prisma.blogPost.count(),
    ]);
    return { posts, total, pages: Math.ceil(total / 20) };
  }

  async getBlogPost(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException();
    return post;
  }

  async createBlogPost(adminId: string, data: any) {
    const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return this.prisma.blogPost.create({
      data: { ...data, slug, authorId: adminId },
    });
  }

  async updateBlogPost(id: string, data: any) {
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  async deleteBlogPost(id: string) {
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: "پست حذف شد" };
  }

  // ─── Page Content ─────────────────────────────────────────────────────────

  async getPageContent(id: string) {
    const content = await this.prisma.pageContent.findUnique({ where: { id } });
    return content || { id, content: {}, title: id };
  }

  async updatePageContent(id: string, data: any) {
    return this.prisma.pageContent.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }

  // ─── Landing Pages ────────────────────────────────────────────────────────

  async getLandingPages() {
    return this.prisma.landingPage.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getLandingPage(id: string) {
    const lp = await this.prisma.landingPage.findUnique({ where: { id } });
    if (!lp) throw new NotFoundException();
    return lp;
  }

  async createLandingPage(data: any) {
    return this.prisma.landingPage.create({ data });
  }

  async updateLandingPage(id: string, data: any) {
    return this.prisma.landingPage.update({ where: { id }, data });
  }

  async deleteLandingPage(id: string) {
    await this.prisma.landingPage.delete({ where: { id } });
    return { message: "صفحه حذف شد" };
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  async getNotifications() {
    return this.prisma.notification.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async sendNotification(data: SendNotificationDto) {
    return this.prisma.notification.create({
      data: { ...data, isGlobal: true },
    });
  }

  async deleteNotification(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { message: "اعلان حذف شد" };
  }

  // ─── Coupons (admin-level) ────────────────────────────────────────────────

  async getAllCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { shop: { select: { slug: true, name: true } } },
    });
  }

  async createGlobalCoupon(data: CreateGlobalCouponDto) {
    const code = data.code.toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new BadRequestException("این کد قبلاً ثبت شده");
    return this.prisma.coupon.create({
      data: { code, type: data.type, value: data.value, maxUses: data.maxUses ?? -1,
              expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
    });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { message: "کد حذف شد" };
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings() {
    const s = await this.prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!s) return {};
    const { ...safe } = s as any;
    return safe;
  }

  async updateSettings(adminId: string, data: any) {
    const updated = await this.prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });
    await this.prisma.adminLog.create({
      data: { adminId, action: "UPDATE_SETTINGS", data },
    });
    return updated;
  }

  async changeAdminCredentials(adminId: string, data: ChangeAdminCredentialsDto) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundException();

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

    await this.prisma.user.update({ where: { id: adminId }, data: updateData });
    if (data.username || data.email) {
      await this.prisma.siteSettings.update({
        where: { id: "default" },
        data: {
          adminUsername: data.username,
          adminEmail: data.email,
        },
      });
    }
    return { message: "اطلاعات ادمین بروز شد" };
  }

  // ─── Admins ───────────────────────────────────────────────────────────────

  async getAdmins() {
    return this.prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, email: true, phone: true, role: true, createdAt: true, lastLoginAt: true },
    });
  }

  async promoteUser(adminId: string, targetId: string, role: "ADMIN" | "USER") {
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role },
    });
    await this.prisma.adminLog.create({
      data: { adminId, action: `SET_ROLE_${role}`, target: targetId },
    });
    return updated;
  }

  // ─── Activity Logs ────────────────────────────────────────────────────────

  async getLogs(page: number = 1) {
    page = Math.max(1, Number(page) || 1);
    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 30,
        take: 30,
        include: { admin: { select: { email: true } } },
      }),
      this.prisma.adminLog.count(),
    ]);
    return { logs, total, pages: Math.ceil(total / 30) };
  }

  // ─── Tool Analytics ───────────────────────────────────────────────────────

  async getToolStats() {
    const blockStats = await this.prisma.block.groupBy({
      by: ["type"],
      _count: { id: true },
      _sum: { clickCount: true },
      orderBy: { _count: { id: "desc" } },
    });
    const totalClicks = await this.prisma.analytics.count({ where: { event: "BLOCK_CLICK" } });
    const totalViews  = await this.prisma.analytics.count({ where: { event: "PAGE_VIEW" } });
    return { blockStats, totalClicks, totalViews };
  }

  // ─── Server Stats ─────────────────────────────────────────────────────────

  async getServerStats() {
    const cpus     = os.cpus();
    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const usedMem  = totalMem - freeMem;
    const uptime   = os.uptime();

    const [dbUsers, dbShops, dbOrders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.shop.count(),
      this.prisma.order.count(),
    ]);

    return {
      cpu: { count: cpus.length, model: cpus[0]?.model },
      memory: {
        total: Math.round(totalMem / 1024 / 1024),
        used: Math.round(usedMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        percent: Math.round((usedMem / totalMem) * 100),
      },
      uptime: Math.round(uptime),
      platform: os.platform(),
      nodeVersion: process.version,
      db: { users: dbUsers, shops: dbShops, orders: dbOrders },
    };
  }
}
