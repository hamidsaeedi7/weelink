import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, phone: true, plan: true,
        planExpiresAt: true, role: true, isVerified: true,
        createdAt: true, lastLoginAt: true,
        shop: { select: { id: true, slug: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? { OR: [{ email: { contains: search } }, { phone: { contains: search } }] }
      : {};
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, phone: true, plan: true,
          isVerified: true, isBlocked: true, role: true, createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateProfile(id: string, data: { email?: string; phone?: string }) {
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) throw new BadRequestException("این ایمیل قبلاً ثبت شده");
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, phone: true, plan: true, planExpiresAt: true },
    });
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user?.passwordHash) throw new BadRequestException("حساب شما رمز عبور ندارد");
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new BadRequestException("رمز عبور فعلی اشتباه است");
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash: hash } });
    return { message: "رمز عبور تغییر یافت" };
  }

  async upgradePlan(id: string, plan: "PRO", months: number) {
    const price = months === 12 ? 990000 : months === 6 ? 540000 : 99000;
    const expiresAt = new Date(Date.now() + months * 30 * 86400000);
    await Promise.all([
      this.prisma.user.update({ where: { id }, data: { plan: "PRO", planExpiresAt: expiresAt } }),
      this.prisma.subscription.create({
        data: { userId: id, plan: "PRO", duration: months, price: BigInt(price), expiresAt },
      }),
    ]);
    return { message: "حساب پرو فعال شد", expiresAt };
  }
}
