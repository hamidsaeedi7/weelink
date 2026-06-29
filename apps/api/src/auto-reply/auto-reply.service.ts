import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
// PRO-only: auto-reply features require PRO plan

@Injectable()
export class AutoReplyService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan !== "PRO") throw new ForbiddenException("این ویژگی برای پلن Pro است");
    return this.prisma.autoReply.create({
      data: { userId, platform: dto.platform, keyword: dto.keyword, reply: dto.reply, isActive: dto.isActive ?? true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.autoReply.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async update(userId: string, id: string, dto: any) {
    const ar = await this.prisma.autoReply.findUnique({ where: { id } });
    if (!ar) throw new NotFoundException();
    if (ar.userId !== userId) throw new ForbiddenException();
    return this.prisma.autoReply.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const ar = await this.prisma.autoReply.findUnique({ where: { id } });
    if (!ar) throw new NotFoundException();
    if (ar.userId !== userId) throw new ForbiddenException();
    await this.prisma.autoReply.delete({ where: { id } });
    return { success: true };
  }
}
