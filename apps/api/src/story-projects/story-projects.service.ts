import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStoryProjectDto, UpdateStoryProjectDto } from "./dto/story-project.dto";

/** Autosave posts the whole document, so an upper bound matters. */
const MAX_DOC_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_THUMBNAIL_BYTES = 400 * 1024;
const MAX_PROJECTS = 100;

@Injectable()
export class StoryProjectsService {
  constructor(private prisma: PrismaService) {}

  private async getShopId(userId: string): Promise<string> {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop.id;
  }

  private assertDocSize(doc: unknown) {
    const bytes = Buffer.byteLength(JSON.stringify(doc ?? {}), "utf8");
    if (bytes > MAX_DOC_BYTES) {
      throw new BadRequestException("حجم پروژه بیش از حد مجاز است");
    }
  }

  private assertThumbSize(thumbnail?: string) {
    if (thumbnail && Buffer.byteLength(thumbnail, "utf8") > MAX_THUMBNAIL_BYTES) {
      throw new BadRequestException("حجم پیش‌نمایش بیش از حد مجاز است");
    }
  }

  /** List is intentionally without `doc` — the payloads are large and the
   *  gallery only needs name/thumbnail/date. */
  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    return this.prisma.storyProject.findMany({
      where: { shopId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, thumbnail: true, createdAt: true, updatedAt: true },
    });
  }

  async findOne(userId: string, id: string) {
    const shopId = await this.getShopId(userId);
    // shopId is part of the lookup, so another shop's id simply 404s rather
    // than leaking existence.
    const project = await this.prisma.storyProject.findFirst({ where: { id, shopId } });
    if (!project) throw new NotFoundException("پروژه یافت نشد");
    return project;
  }

  async create(userId: string, dto: CreateStoryProjectDto) {
    const shopId = await this.getShopId(userId);
    this.assertDocSize(dto.doc);
    this.assertThumbSize(dto.thumbnail);

    const count = await this.prisma.storyProject.count({ where: { shopId } });
    if (count >= MAX_PROJECTS) {
      throw new BadRequestException(`حداکثر ${MAX_PROJECTS} پروژه می‌توانید ذخیره کنید`);
    }

    return this.prisma.storyProject.create({
      data: {
        shopId,
        name: dto.name?.trim() || "استوری بدون عنوان",
        doc: dto.doc as any,
        thumbnail: dto.thumbnail,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateStoryProjectDto) {
    const shopId = await this.getShopId(userId);
    const existing = await this.prisma.storyProject.findFirst({ where: { id, shopId } });
    if (!existing) throw new NotFoundException("پروژه یافت نشد");

    if (dto.doc !== undefined) this.assertDocSize(dto.doc);
    this.assertThumbSize(dto.thumbnail);

    return this.prisma.storyProject.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() || "استوری بدون عنوان" } : {}),
        ...(dto.doc !== undefined ? { doc: dto.doc as any } : {}),
        ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    const shopId = await this.getShopId(userId);
    const existing = await this.prisma.storyProject.findFirst({ where: { id, shopId } });
    if (!existing) throw new NotFoundException("پروژه یافت نشد");
    await this.prisma.storyProject.delete({ where: { id } });
    return { success: true };
  }
}
