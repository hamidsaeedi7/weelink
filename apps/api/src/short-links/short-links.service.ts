import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";

function randomCode(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len);
}

@Injectable()
export class ShortLinksService {
  constructor(private prisma: PrismaService) {}

  private async getShopAndPlan(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop;
  }

  async create(userId: string, dto: any) {
    const shop = await this.getShopAndPlan(userId);
    if (shop.user.plan !== "PRO") throw new ProRequiredException();

    let shortCode = dto.shortCode || randomCode();
    const existing = await this.prisma.shortLink.findUnique({ where: { shortCode } });
    if (existing) {
      if (dto.shortCode) throw new ConflictException("این کد قبلاً استفاده شده");
      shortCode = randomCode() + randomCode(2);
    }
    return this.prisma.shortLink.create({
      data: { shopId: shop.id, originalUrl: dto.originalUrl, shortCode, title: dto.title },
    });
  }

  async findAll(userId: string) {
    const shop = await this.getShopAndPlan(userId);
    if (shop.user.plan !== "PRO") throw new ProRequiredException();
    return this.prisma.shortLink.findMany({ where: { shopId: shop.id }, orderBy: { createdAt: "desc" } });
  }

  async update(userId: string, id: string, dto: any) {
    const link = await this.prisma.shortLink.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!link) throw new NotFoundException();
    if (link.shop.userId !== userId) throw new ForbiddenException();

    const data: any = { originalUrl: dto.originalUrl, title: dto.title };
    if (dto.shortCode && dto.shortCode !== link.shortCode) {
      const existing = await this.prisma.shortLink.findUnique({ where: { shortCode: dto.shortCode } });
      if (existing) throw new ConflictException("این کد قبلاً استفاده شده");
      data.shortCode = dto.shortCode;
    }
    return this.prisma.shortLink.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const link = await this.prisma.shortLink.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!link) throw new NotFoundException();
    if (link.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.shortLink.delete({ where: { id } });
    return { success: true };
  }

  async redirect(shortCode: string) {
    const link = await this.prisma.shortLink.findUnique({ where: { shortCode } });
    if (!link || !link.isActive) throw new NotFoundException();
    await this.prisma.shortLink.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } });
    return link.originalUrl;
  }
}
