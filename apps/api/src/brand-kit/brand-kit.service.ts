import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";
import { UpdateBrandKitDto } from "./dto/brand-kit.dto";

@Injectable()
export class BrandKitService {
  constructor(private prisma: PrismaService) {}

  private async getShop(userId: string, requirePro = false) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: { user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (requirePro && (shop as any).user.plan !== "PRO") throw new ProRequiredException();
    return shop;
  }

  /**
   * Returns the brand kit already merged with its Shop fallbacks, so the
   * client never has to know which values were overridden and which came
   * from the shop record.
   */
  async find(userId: string) {
    const shop = await this.getShop(userId);
    const kit = await this.prisma.brandKit.findUnique({ where: { shopId: shop.id } });

    const fallbackColors = [shop.primaryColor, shop.secondaryColor].filter(Boolean) as string[];

    return {
      logoUrl: kit?.logoUrl ?? shop.avatarUrl ?? null,
      colors: kit?.colors?.length ? kit.colors : fallbackColors,
      fontFamily: kit?.fontFamily ?? shop.fontFamily ?? null,
      handle: kit?.handle ?? null,
      website: kit?.website ?? null,
      phone: kit?.phone ?? null,
      defaultCta: kit?.defaultCta ?? null,
      shopName: shop.name,
      shopSlug: shop.slug,
    };
  }

  async upsert(userId: string, dto: UpdateBrandKitDto) {
    const shop = await this.getShop(userId, true);
    const data = {
      logoUrl: dto.logoUrl,
      colors: dto.colors ?? [],
      fontFamily: dto.fontFamily,
      handle: dto.handle?.trim(),
      website: dto.website?.trim(),
      phone: dto.phone?.trim(),
      defaultCta: dto.defaultCta?.trim(),
    };
    await this.prisma.brandKit.upsert({
      where: { shopId: shop.id },
      create: { shopId: shop.id, ...data },
      update: data,
    });
    return this.find(userId);
  }
}
