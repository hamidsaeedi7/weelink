import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FlashSalesService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string, requirePro = false) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (requirePro && (shop as any).user.plan !== "PRO")
      throw new ForbiddenException("این ویژگی برای پلن Pro است");
    return shop.id;
  }

  private serialize(s: any) {
    return {
      ...s,
      originalPrice: s.originalPrice?.toString(),
      salePrice: s.salePrice?.toString(),
    };
  }

  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    const sales = await this.prisma.flashSale.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });
    return sales.map(this.serialize);
  }

  async create(userId: string, dto: any) {
    const shopId = await this.getShopId(userId, true);
    const sale = await this.prisma.flashSale.create({
      data: {
        shopId,
        title: dto.title,
        description: dto.description,
        originalPrice: BigInt(dto.originalPrice || 0),
        salePrice: BigInt(dto.salePrice || 0),
        imageUrl: dto.imageUrl,
        endsAt: new Date(dto.endsAt),
        isActive: dto.isActive ?? true,
      },
    });
    return this.serialize(sale);
  }

  async update(userId: string, id: string, dto: any) {
    const sale = await this.prisma.flashSale.findUnique({
      where: { id },
      select: { shop: { select: { userId: true } } },
    });
    if (!sale || sale.shop.userId !== userId) throw new ForbiddenException();

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.originalPrice !== undefined) data.originalPrice = BigInt(dto.originalPrice);
    if (dto.salePrice !== undefined) data.salePrice = BigInt(dto.salePrice);
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.flashSale.update({ where: { id }, data });
    return this.serialize(updated);
  }

  async remove(userId: string, id: string) {
    const sale = await this.prisma.flashSale.findUnique({
      where: { id },
      select: { shop: { select: { userId: true } } },
    });
    if (!sale || sale.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.flashSale.delete({ where: { id } });
    return { success: true };
  }

  async getPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    const now = new Date();
    const sales = await this.prisma.flashSale.findMany({
      where: { shopId: shop.id, isActive: true, endsAt: { gt: now } },
      orderBy: { endsAt: "asc" },
    });
    return sales.map(this.serialize);
  }
}
