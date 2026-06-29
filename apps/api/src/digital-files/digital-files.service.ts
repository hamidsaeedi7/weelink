import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DigitalFilesService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop.id;
  }

  private serialize(f: any) {
    return { ...f, price: f.price?.toString() };
  }

  async create(userId: string, dto: any) {
    const shopId = await this.getShopId(userId);
    return this.serialize(
      await this.prisma.digitalFile.create({
        data: { shopId, ...dto, price: BigInt(dto.price ?? 0) },
      }),
    );
  }

  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    const files = await this.prisma.digitalFile.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
    });
    return files.map(this.serialize);
  }

  async findAllPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    const files = await this.prisma.digitalFile.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, description: true, coverUrl: true, price: true, isFree: true, downloadCount: true },
    });
    return files.map(this.serialize);
  }

  async update(userId: string, id: string, dto: any) {
    const file = await this.prisma.digitalFile.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!file) throw new NotFoundException();
    if (file.shop.userId !== userId) throw new ForbiddenException();
    const data: any = { ...dto };
    if (dto.price !== undefined) data.price = BigInt(dto.price);
    return this.serialize(await this.prisma.digitalFile.update({ where: { id }, data }));
  }

  async remove(userId: string, id: string) {
    const file = await this.prisma.digitalFile.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!file) throw new NotFoundException();
    if (file.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.digitalFile.delete({ where: { id } });
    return { success: true };
  }
}
