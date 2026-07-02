import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddLeadDto } from "./dto/add-lead.dto";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";

@Injectable()
export class AudienceService {
  constructor(private prisma: PrismaService) {}

  private async getShopAndPlan(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop;
  }

  async findAll(userId: string) {
    const shop = await this.getShopAndPlan(userId);
    if (shop.user.plan !== "PRO") throw new ProRequiredException();
    return this.prisma.audienceLead.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async addLead(shopSlug: string, dto: AddLeadDto) {
    const shop = await this.prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    try {
      return await this.prisma.audienceLead.create({
        data: { shopId: shop.id, email: dto.email, name: dto.name, source: dto.source || "bio" },
      });
    } catch {
      return { message: "already exists" };
    }
  }

  async remove(userId: string, id: string) {
    const lead = await this.prisma.audienceLead.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!lead) throw new NotFoundException();
    if (lead.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.audienceLead.delete({ where: { id } });
    return { success: true };
  }
}
