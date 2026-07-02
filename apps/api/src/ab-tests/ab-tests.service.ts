import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";

@Injectable()
export class AbTestsService {
  constructor(private prisma: PrismaService) {}

  private async getShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop;
  }

  async createTest(userId: string, data: { name: string; variantBDescription?: string }) {
    const shop = await this.getShop(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan !== "PRO") throw new ProRequiredException();

    return (this.prisma as any).aBTest.create({
      data: {
        shopId: shop.id,
        name: data.name,
        variantA: shop.blocks as any,
        variantB: [] as any,
        trafficSplit: 0.5,
        status: "RUNNING",
        winner: null,
        impressionA: 0,
        impressionB: 0,
        conversionA: 0,
        conversionB: 0,
      },
    });
  }

  async getTests(userId: string) {
    const shop = await this.getShop(userId);
    return (this.prisma as any).aBTest.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async getActiveTest(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    return (this.prisma as any).aBTest.findFirst({
      where: { shopId: shop.id, status: "RUNNING" },
      orderBy: { createdAt: "desc" },
    });
  }

  async recordImpression(testId: string, variant: "A" | "B") {
    const field = variant === "A" ? "impressionA" : "impressionB";
    return (this.prisma as any).aBTest.update({
      where: { id: testId },
      data: { [field]: { increment: 1 } },
    });
  }

  async recordConversion(testId: string, variant: "A" | "B") {
    const field = variant === "A" ? "conversionA" : "conversionB";
    return (this.prisma as any).aBTest.update({
      where: { id: testId },
      data: { [field]: { increment: 1 } },
    });
  }

  async endTest(userId: string, testId: string, winner: "A" | "B") {
    const shop = await this.getShop(userId);
    const test = await (this.prisma as any).aBTest.findUnique({
      where: { id: testId },
    });

    if (!test) throw new NotFoundException("تست یافت نشد");
    if (test.shopId !== shop.id)
      throw new ForbiddenException("دسترسی غیرمجاز");

    const winningBlocks = winner === "A" ? test.variantA : test.variantB;

    // Apply winning blocks to shop by resetting blocks
    if (Array.isArray(winningBlocks) && winningBlocks.length > 0) {
      await this.prisma.block.deleteMany({ where: { shopId: shop.id } });
      for (let i = 0; i < winningBlocks.length; i++) {
        const b = winningBlocks[i] as any;
        await this.prisma.block.create({
          data: {
            shopId: shop.id,
            type: b.type,
            label: b.label,
            url: b.url,
            sortOrder: i,
            isActive: b.isActive ?? true,
            data: b.data ?? {},
          },
        });
      }
    }

    return (this.prisma as any).aBTest.update({
      where: { id: testId },
      data: { winner, status: "COMPLETED" },
    });
  }

  async pauseTest(userId: string, testId: string) {
    const shop = await this.getShop(userId);
    const test = await (this.prisma as any).aBTest.findUnique({
      where: { id: testId },
    });

    if (!test) throw new NotFoundException("تست یافت نشد");
    if (test.shopId !== shop.id)
      throw new ForbiddenException("دسترسی غیرمجاز");

    const newStatus = test.status === "PAUSED" ? "RUNNING" : "PAUSED";
    return (this.prisma as any).aBTest.update({
      where: { id: testId },
      data: { status: newStatus },
    });
  }
}
