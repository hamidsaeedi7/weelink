import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { CreateShopDto } from "./dto/create-shop.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";
import { CreateBankCardDto, UpdateBankCardDto } from "./dto/bank-card.dto";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";

const MAX_BANK_CARDS = 4;

@Injectable()
export class ShopsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private static readonly SHOP_CACHE_TTL = 120; // seconds — short, since mutations also invalidate explicitly
  private shopCacheKey(slug: string) {
    return `shop:bySlug:${slug}`;
  }

  async invalidateSlugCache(slug: string): Promise<void> {
    await this.redis.del(this.shopCacheKey(slug));
  }

  /** For callers that only have a shopId (e.g. BlocksService), not the slug directly. */
  async invalidateSlugCacheByShopId(shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } });
    if (shop) await this.invalidateSlugCache(shop.slug);
  }

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
    const cacheKey = this.shopCacheKey(slug);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        bankCards: { where: { isActive: true }, take: 1 },
        user: { select: { plan: true } },
      },
    });
    if (!shop || !shop.isActive) throw new NotFoundException("صفحه بیو یافت نشد");
    // Expose only the owner's plan (drives the free "Made with Weelink" badge)
    const { user, bankCards, ...rest } = shop as any;
    const activeCard = bankCards?.[0];

    // Storefront link counts + active flash sales — fetched here (and cached alongside
    // everything else) instead of via separate client-side calls from the bio page.
    const [productsCount, filesCount, coursesCount, servicesCount, activeFlashSalesRaw] = await Promise.all([
      this.prisma.product.count({ where: { shopId: shop.id, isAvailable: true } }),
      this.prisma.digitalFile.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.course.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.appointmentService.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.flashSale.findMany({
        where: { shopId: shop.id, isActive: true, endsAt: { gt: new Date() } },
        orderBy: { endsAt: "asc" },
      }),
    ]);
    const activeFlashSales = activeFlashSalesRaw.map((s) => ({
      ...s,
      originalPrice: s.originalPrice?.toString(),
      salePrice: s.salePrice?.toString(),
    }));

    const result = {
      ...rest,
      ownerPlan: user?.plan ?? "FREE",
      // Flattened for backward compat with checkout/booking/PurchaseModal
      cardNumber: activeCard?.cardNumber ?? null,
      cardHolder: activeCard?.cardHolder ?? null,
      bankName: activeCard?.bankName ?? null,
      storefrontCounts: {
        products: productsCount,
        files: filesCount,
        courses: coursesCount,
        services: servicesCount,
      },
      activeFlashSales,
    };
    await this.redis.set(cacheKey, JSON.stringify(result), ShopsService.SHOP_CACHE_TTL);
    return result;
  }

  async findByUser(userId: string) {
    let shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
        bankCards: { orderBy: { sortOrder: "asc" } },
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
        bankCards: { orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true, orders: true } },
      },
    });
  }

  async listBankCards(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return this.prisma.bankCard.findMany({ where: { shopId: shop.id }, orderBy: { sortOrder: "asc" } });
  }

  async createBankCard(userId: string, dto: CreateBankCardDto) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    const count = await this.prisma.bankCard.count({ where: { shopId: shop.id } });
    if (count >= MAX_BANK_CARDS) throw new ConflictException("حداکثر ۴ کارت بانکی می‌توانید ثبت کنید");
    const card = await this.prisma.bankCard.create({
      data: { shopId: shop.id, ...dto, isActive: count === 0, sortOrder: count },
    });
    await this.invalidateSlugCache(shop.slug);
    return card;
  }

  async updateBankCard(userId: string, cardId: string, dto: UpdateBankCardDto) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    const card = await this.prisma.bankCard.findUnique({ where: { id: cardId } });
    if (!card || card.shopId !== shop.id) throw new NotFoundException("کارت یافت نشد");
    const updated = await this.prisma.bankCard.update({ where: { id: cardId }, data: dto });
    await this.invalidateSlugCache(shop.slug);
    return updated;
  }

  async deleteBankCard(userId: string, cardId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    const card = await this.prisma.bankCard.findUnique({ where: { id: cardId } });
    if (!card || card.shopId !== shop.id) throw new NotFoundException("کارت یافت نشد");
    await this.prisma.bankCard.delete({ where: { id: cardId } });
    if (card.isActive) {
      const next = await this.prisma.bankCard.findFirst({
        where: { shopId: shop.id },
        orderBy: { sortOrder: "asc" },
      });
      if (next) await this.prisma.bankCard.update({ where: { id: next.id }, data: { isActive: true } });
    }
    await this.invalidateSlugCache(shop.slug);
    return { success: true };
  }

  async activateBankCard(userId: string, cardId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    const card = await this.prisma.bankCard.findUnique({ where: { id: cardId } });
    if (!card || card.shopId !== shop.id) throw new NotFoundException("کارت یافت نشد");
    await this.prisma.$transaction([
      this.prisma.bankCard.updateMany({ where: { shopId: shop.id, isActive: true }, data: { isActive: false } }),
      this.prisma.bankCard.update({ where: { id: cardId }, data: { isActive: true } }),
    ]);
    await this.invalidateSlugCache(shop.slug);
    return { success: true };
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
      throw new ProRequiredException();
    }

    if (dto.slug && dto.slug !== shop.slug) {
      const taken = await this.prisma.shop.findUnique({ where: { slug: dto.slug } });
      if (taken) throw new ConflictException("این آدرس قبلاً استفاده شده است");
    }

    const updated = await this.prisma.shop.update({ where: { userId }, data: dto });
    await this.invalidateSlugCache(shop.slug);
    if (dto.slug && dto.slug !== shop.slug) await this.invalidateSlugCache(updated.slug);
    return updated;
  }

  async checkSlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug } });
    return { available: !shop };
  }

  async recordPageView(slug: string, ip?: string, userAgent?: string, referer?: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) return;
    await this.prisma.analytics.create({
      // "PAGE_VIEW" is the canonical event name every analytics reader queries;
      // this used to write lowercase "pageview", making all view counts read 0.
      data: { shopId: shop.id, event: "PAGE_VIEW", ip, userAgent, referer },
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
