import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentPlanDto, UpdateContentPlanDto } from './dto/content-plan.dto';

@Injectable()
export class ContentPlansService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string): Promise<string> {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException('فروشگاه یافت نشد');
    return shop.id;
  }

  async create(userId: string, dto: CreateContentPlanDto) {
    // PRO guard
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.plan !== 'PRO') {
      throw new ForbiddenException('این قابلیت فقط برای کاربران PRO است');
    }

    const shopId = await this.getShopId(userId);

    return this.prisma.contentPlan.create({
      data: {
        shopId,
        title: dto.title,
        description: dto.description,
        platform: dto.platform ?? 'instagram',
        contentType: dto.contentType ?? 'post',
        scheduledAt: new Date(dto.scheduledAt),
        color: dto.color ?? '#F97316',
        notifyBefore: dto.notifyBefore ?? [24],
        notifyViaSms: dto.notifyViaSms ?? false,
        notifyViaEmail: dto.notifyViaEmail ?? false,
        notifyViaTelegram: dto.notifyViaTelegram ?? false,
        remindersSent: [],
        status: 'PLANNED',
      },
    });
  }

  async findAll(
    userId: string,
    query?: { month?: string; year?: string; view?: string },
  ) {
    const shopId = await this.getShopId(userId);

    const where: any = { shopId };

    if (query?.year && query?.month) {
      const year = parseInt(query.year, 10);
      const month = parseInt(query.month, 10);

      let startDate: Date;
      let endDate: Date;

      if (query.view === 'quarter') {
        // 3-month range starting from this month
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month + 2, 0, 23, 59, 59, 999);
      } else if (query.view === 'halfyear') {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month + 5, 0, 23, 59, 59, 999);
      } else if (query.view === 'year') {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      } else {
        // default: month view
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      }

      where.scheduledAt = { gte: startDate, lte: endDate };
    } else if (query?.year) {
      const year = parseInt(query.year, 10);
      where.scheduledAt = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    }

    return this.prisma.contentPlan.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const shopId = await this.getShopId(userId);
    const plan = await this.prisma.contentPlan.findUnique({ where: { id } });
    if (!plan || plan.shopId !== shopId) throw new NotFoundException('برنامه محتوا یافت نشد');
    return plan;
  }

  async update(userId: string, id: string, dto: UpdateContentPlanDto) {
    const plan = await this.findOne(userId, id);

    const data: any = { ...dto };

    if ((dto as any).scheduledAt) {
      data.scheduledAt = new Date((dto as any).scheduledAt);
      if (plan.scheduledAt.getTime() !== data.scheduledAt.getTime()) {
        data.remindersSent = [];
      }
    }

    return this.prisma.contentPlan.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.contentPlan.delete({ where: { id } });
  }

  async updateStatus(userId: string, id: string, status: string) {
    await this.findOne(userId, id);
    return this.prisma.contentPlan.update({
      where: { id },
      data: { status },
    });
  }
}
