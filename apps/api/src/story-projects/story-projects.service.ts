import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";
import { CreateStoryProjectDto, UpdateStoryProjectDto } from "./dto/story-project.dto";

/** Autosave posts the whole document, so an upper bound matters. */
const MAX_DOC_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_THUMBNAIL_BYTES = 400 * 1024;
const MAX_PROJECTS = 100;

/** Multi-page/carousel stories are a Pro feature — free stays single-page. */
const FREE_PAGE_LIMIT = 1;

@Injectable()
export class StoryProjectsService {
  constructor(private prisma: PrismaService) {}

  private async getShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop;
  }

  /**
   * Blocks GROWING a story past the free page limit — not editing one that's
   * already over it. Without `previousCount`, a free user who owns an old
   * multi-page project (saved before this gate existed, or from a Pro plan
   * that later lapsed) would get every autosave rejected just for editing
   * existing pages, which would look like the editor silently broke.
   */
  private assertPageLimit(doc: unknown, plan: string, previousCount = 0) {
    const pages = (doc as any)?.pages;
    const count = Array.isArray(pages) ? pages.length : 0;
    if (count > FREE_PAGE_LIMIT && count > previousCount && plan !== "PRO") {
      throw new ProRequiredException("چندصفحه‌ای بودن استوری فقط در پلن Pro در دسترس است");
    }
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
    const { id: shopId } = await this.getShop(userId);
    return this.prisma.storyProject.findMany({
      where: { shopId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, thumbnail: true, createdAt: true, updatedAt: true },
    });
  }

  async findOne(userId: string, id: string) {
    const { id: shopId } = await this.getShop(userId);
    // shopId is part of the lookup, so another shop's id simply 404s rather
    // than leaking existence.
    const project = await this.prisma.storyProject.findFirst({ where: { id, shopId } });
    if (!project) throw new NotFoundException("پروژه یافت نشد");
    return project;
  }

  async create(userId: string, dto: CreateStoryProjectDto) {
    const shop = await this.getShop(userId);
    this.assertDocSize(dto.doc);
    this.assertThumbSize(dto.thumbnail);
    this.assertPageLimit(dto.doc, (shop as any).user.plan);

    const count = await this.prisma.storyProject.count({ where: { shopId: shop.id } });
    if (count >= MAX_PROJECTS) {
      throw new BadRequestException(`حداکثر ${MAX_PROJECTS} پروژه می‌توانید ذخیره کنید`);
    }

    return this.prisma.storyProject.create({
      data: {
        shopId: shop.id,
        name: dto.name?.trim() || "استوری بدون عنوان",
        doc: dto.doc as any,
        thumbnail: dto.thumbnail,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateStoryProjectDto) {
    const shop = await this.getShop(userId);
    const existing = await this.prisma.storyProject.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) throw new NotFoundException("پروژه یافت نشد");

    if (dto.doc !== undefined) {
      this.assertDocSize(dto.doc);
      const previousPages = (existing.doc as any)?.pages;
      const previousCount = Array.isArray(previousPages) ? previousPages.length : 0;
      this.assertPageLimit(dto.doc, (shop as any).user.plan, previousCount);
    }
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
    const { id: shopId } = await this.getShop(userId);
    const existing = await this.prisma.storyProject.findFirst({ where: { id, shopId } });
    if (!existing) throw new NotFoundException("پروژه یافت نشد");
    await this.prisma.storyProject.delete({ where: { id } });
    return { success: true };
  }
}
