import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop.id;
  }

  async create(userId: string, dto: CreateProductDto) {
    const shopId = await this.getShopId(userId);
    return this.prisma.product.create({
      data: { shopId, ...dto, price: BigInt(dto.price) },
    });
  }

  async findAllPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    const products = await this.prisma.product.findMany({
      where: { shopId: shop.id, isAvailable: true },
      orderBy: { sortOrder: "asc" },
    });
    return products.map(this.serialize);
  }

  async findAllOwner(userId: string) {
    const shopId = await this.getShopId(userId);
    const products = await this.prisma.product.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
    });
    return products.map(this.serialize);
  }

  async update(userId: string, id: string, dto: Partial<CreateProductDto>) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!product) throw new NotFoundException();
    if (product.shop.userId !== userId) throw new ForbiddenException();
    const data: any = { ...dto };
    if (dto.price !== undefined) data.price = BigInt(dto.price);
    return this.serialize(await this.prisma.product.update({ where: { id }, data }));
  }

  async remove(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!product) throw new NotFoundException();
    if (product.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.product.delete({ where: { id } });
    return { message: "محصول حذف شد" };
  }

  private serialize(p: any) {
    return { ...p, price: Number(p.price) };
  }
}
