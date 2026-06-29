import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string, requirePro = false) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (requirePro && (shop as any).user.plan !== "PRO")
      throw new ForbiddenException("این ویژگی برای پلن Pro است");
    return shop.id;
  }

  private serialize(c: any) {
    return { ...c, price: c.price?.toString() };
  }

  async create(userId: string, dto: any) {
    const shopId = await this.getShopId(userId, true);
    return this.serialize(
      await this.prisma.course.create({
        data: { shopId, ...dto, price: BigInt(dto.price ?? 0) },
      }),
    );
  }

  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    const courses = await this.prisma.course.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { chapters: true, enrollments: true } } },
    });
    return courses.map(this.serialize);
  }

  async findAllPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException();
    const courses = await this.prisma.course.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, description: true, coverUrl: true, price: true, isFree: true,
        chapters: { where: { isPreview: true }, select: { id: true, title: true, videoUrl: true } } },
    });
    return courses.map(this.serialize);
  }

  async update(userId: string, id: string, dto: any) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!course) throw new NotFoundException();
    if (course.shop.userId !== userId) throw new ForbiddenException();
    const data: any = { ...dto };
    if (dto.price !== undefined) data.price = BigInt(dto.price);
    return this.serialize(await this.prisma.course.update({ where: { id }, data }));
  }

  async remove(userId: string, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { shop: { select: { userId: true } } },
    });
    if (!course) throw new NotFoundException();
    if (course.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.course.delete({ where: { id } });
    return { success: true };
  }

  // Chapters
  async getChapters(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { shop: { select: { userId: true } } },
    });
    if (!course) throw new NotFoundException();
    if (course.shop.userId !== userId) throw new ForbiddenException();
    return this.prisma.courseChapter.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createChapter(userId: string, courseId: string, dto: any) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { shop: { select: { userId: true } } },
    });
    if (!course) throw new NotFoundException();
    if (course.shop.userId !== userId) throw new ForbiddenException();
    return this.prisma.courseChapter.create({ data: { courseId, ...dto } });
  }

  async updateChapter(userId: string, chapterId: string, dto: any) {
    const chapter = await this.prisma.courseChapter.findUnique({
      where: { id: chapterId },
      include: { course: { include: { shop: { select: { userId: true } } } } },
    });
    if (!chapter) throw new NotFoundException();
    if (chapter.course.shop.userId !== userId) throw new ForbiddenException();
    return this.prisma.courseChapter.update({ where: { id: chapterId }, data: dto });
  }

  async removeChapter(userId: string, chapterId: string) {
    const chapter = await this.prisma.courseChapter.findUnique({
      where: { id: chapterId },
      include: { course: { include: { shop: { select: { userId: true } } } } },
    });
    if (!chapter) throw new NotFoundException();
    if (chapter.course.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.courseChapter.delete({ where: { id: chapterId } });
    return { success: true };
  }
}
