import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShopDto } from "./dto/create-shop.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateShopDto) {
    const existing = await this.prisma.shop.findUnique({ where: { userId } });
    if (existing) throw new ConflictException("شما قبلاً فروشگاه ایجاد کرده‌اید");

    const slugTaken = await this.prisma.shop.findUnique({ where: { slug: dto.slug } });
    if (slugTaken) throw new ConflictException("این آدرس قبلاً استفاده شده است");

    return this.prisma.shop.create({
      data: { userId, name: dto.name, slug: dto.slug, bio: dto.bio },
    });
  }

  async findBySlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!shop || !shop.isActive) throw new NotFoundException("صفحه بیو یافت نشد");
    return shop;
  }

  async findByUser(userId: string) {
    let shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!shop) {
      shop = await this.autoCreateShop(userId);
    }
    return shop;
  }

  private async autoCreateShop(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, email: true },
    });
    const base = user?.phone
      ? user.phone.replace(/\D/g, "").slice(-8)
      : (user?.email?.split("@")[0] || "user").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20);
    let slug = base || "user";
    let suffix = 1;
    while (await this.prisma.shop.findUnique({ where: { slug } })) {
      slug = `${base}${suffix++}`;
    }
    return this.prisma.shop.create({
      data: { userId, name: "صفحه من", slug },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true, orders: true } },
      },
    });
  }

  async update(userId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: { user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    const proFields = ["avatarVideo", "bgVideoUrl", "gaId", "metaPixel"] as const;
    const hasProField = proFields.some((f) => dto[f] !== undefined && dto[f] !== "");
    if (hasProField && (shop as any).user.plan !== "PRO") {
      throw new ForbiddenException("این ویژگی برای پلن Pro است");
    }

    if (dto.slug && dto.slug !== shop.slug) {
      const taken = await this.prisma.shop.findUnique({ where: { slug: dto.slug } });
      if (taken) throw new ConflictException("این آدرس قبلاً استفاده شده است");
    }

    return this.prisma.shop.update({ where: { userId }, data: dto });
  }

  async checkSlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug } });
    return { available: !shop };
  }

  async recordPageView(slug: string, ip?: string, userAgent?: string, referer?: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) return;
    await this.prisma.analytics.create({
      data: { shopId: shop.id, event: "pageview", ip, userAgent, referer },
    });
  }

  async getAllPublicSlugs() {
    return this.prisma.shop.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
