import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop.id;
  }

  private serialize(a: any) {
    return { ...a, earnings: a.earnings?.toString() };
  }

  async create(userId: string, dto: any) {
    const shopId = await this.getShopId(userId);
    return this.serialize(
      await this.prisma.affiliateLink.create({
        data: { shopId, title: dto.title, originalUrl: dto.originalUrl, commission: dto.commission ?? 0 },
      }),
    );
  }

  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    const links = await this.prisma.affiliateLink.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });
    return links.map(this.serialize);
  }

  async update(userId: string, id: string, dto: any) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!link) throw new NotFoundException();
    if (link.shop.userId !== userId) throw new ForbiddenException();
    return this.serialize(await this.prisma.affiliateLink.update({ where: { id }, data: dto }));
  }

  async remove(userId: string, id: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!link) throw new NotFoundException();
    if (link.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.affiliateLink.delete({ where: { id } });
    return { success: true };
  }

  async trackClick(id: string) {
    const link = await this.prisma.affiliateLink.findUnique({ where: { id } });
    if (!link || !link.isActive) throw new NotFoundException();
    await this.prisma.affiliateLink.update({ where: { id }, data: { clickCount: { increment: 1 } } });
    return link.originalUrl;
  }
}
