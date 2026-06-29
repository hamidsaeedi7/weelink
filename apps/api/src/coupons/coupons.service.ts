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

    return this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        maxUses: dto.maxUses ?? -1,
        shopId: shop?.id,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
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

  async remove(userId: string, id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    await this.prisma.coupon.deleteMany({ where: { id, shopId: shop?.id } });
    return { message: "کد تخفیف حذف شد" };
  }
}
