import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCouponDto, ValidateCouponDto } from "./dto/create-coupon.dto";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCouponDto) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new BadRequestException("این کد قبلاً ثبت شده");

    const scopeType = dto.scopeType ?? "ALL";
    if (scopeType !== "ALL" && scopeType !== "CATEGORY" && !dto.scopeId) {
      throw new BadRequestException("مورد هدف کد تخفیف را انتخاب کنید");
    }
    if (scopeType === "CATEGORY" && !dto.scopeCategory) {
      throw new BadRequestException("دستهٔ محصول هدف را انتخاب کنید");
    }

    return this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        maxUses: dto.maxUses ?? -1,
        shopId: shop?.id,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        scopeType,
        scopeId: scopeType === "ALL" || scopeType === "CATEGORY" ? null : dto.scopeId,
        scopeName: scopeType === "ALL" ? null : (dto.scopeName ?? null),
        scopeCategory: scopeType === "CATEGORY" ? dto.scopeCategory : null,
      },
    });
  }

  async findAll(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) return [];
    return this.prisma.coupon.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async validate(dto: ValidateCouponDto) {
    const code = dto.code.toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) throw new NotFoundException("کد تخفیف معتبر نیست");
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      throw new BadRequestException("کد تخفیف منقضی شده");
    if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses)
      throw new BadRequestException("ظرفیت کد تخفیف تمام شده");

    if (coupon.scopeType && coupon.scopeType !== "ALL") {
      await this.assertScopeMatches(coupon, dto);
    }

    const discount =
      coupon.type === "percent"
        ? Math.floor((dto.total * coupon.value) / 100)
        : Math.min(coupon.value, dto.total);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      finalPrice: dto.total - discount,
    };
  }

  /** Ensures the item(s) being purchased match the coupon's target scope. */
  private async assertScopeMatches(coupon: any, dto: ValidateCouponDto) {
    const typeMap: Record<string, string> = {
      PRODUCT: "PRODUCT",
      DIGITAL_FILE: "DIGITAL_FILE",
      COURSE: "COURSE",
    };
    const scopeKind = typeMap[coupon.scopeType];

    if (coupon.scopeType === "CATEGORY") {
      if (dto.itemType !== "PRODUCT" || !dto.itemIds?.length) {
        throw new BadRequestException(`این کد فقط برای دستهٔ «${coupon.scopeCategory}» معتبر است`);
      }
      const products = await this.prisma.product.findMany({
        where: { id: { in: dto.itemIds } },
        select: { category: true },
      });
      const allMatch = products.length === dto.itemIds.length && products.every((p) => p.category === coupon.scopeCategory);
      if (!allMatch) throw new BadRequestException(`این کد فقط برای دستهٔ «${coupon.scopeCategory}» معتبر است`);
      return;
    }

    if (!scopeKind || dto.itemType !== scopeKind || !dto.itemIds?.length) {
      throw new BadRequestException(`این کد فقط برای «${coupon.scopeName || "یک مورد خاص"}» معتبر است`);
    }
    const allMatchId = dto.itemIds.every((id) => id === coupon.scopeId);
    if (!allMatchId) {
      throw new BadRequestException(`این کد فقط برای «${coupon.scopeName || "یک مورد خاص"}» معتبر است`);
    }
  }

  async remove(userId: string, id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    await this.prisma.coupon.deleteMany({ where: { id, shopId: shop?.id } });
    return { message: "کد تخفیف حذف شد" };
  }
}
