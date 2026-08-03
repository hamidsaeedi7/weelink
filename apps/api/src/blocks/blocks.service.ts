import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ShopsService } from "../shops/shops.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { ReorderBlocksDto } from "./dto/reorder-blocks.dto";
import { ApplyTemplateDto, RestoreBlocksDto } from "./dto/apply-template.dto";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";

/**
 * Which ready-made templates are Pro-only. Only the id→plan mapping lives
 * here; the template *content* stays in the web app (page-templates.ts),
 * because duplicating 300 lines of Persian copy across two apps is how the
 * two versions drift apart. The client sends the block list it wants applied,
 * which is safe: every block type it can send, a seller can already create by
 * hand — the thing being gated is the curated template, not the block types.
 */
const PRO_TEMPLATE_IDS = new Set([
  "sport", "jewelry", "fashion", "beauty", "realestate", "auto", "kids", "education",
]);

@Injectable()
export class BlocksService {
  constructor(
    private prisma: PrismaService,
    private shops: ShopsService,
  ) {}

  /**
   * Normalizes incoming block data before it reaches Prisma.
   * The edit panel always sends scheduleStart/scheduleEnd as strings — often
   * empty ("") when unset — which Prisma rejects for a DateTime? column and
   * throws, surfacing to the user as "خطا در ذخیره". Convert empties to null
   * and valid datetime-local strings to Date. Also drop any stray non-editable
   * fields (id, shopId, timestamps, counters) the client may echo back.
   */
  private sanitize<T extends Record<string, any>>(dto: T): T {
    const clean: Record<string, any> = { ...dto };
    for (const key of ["id", "shopId", "clickCount", "createdAt", "updatedAt"]) {
      delete clean[key];
    }
    for (const key of ["scheduleStart", "scheduleEnd"]) {
      const v = clean[key];
      if (v === undefined) continue;
      if (v === "" || v === null) {
        clean[key] = null;
      } else if (typeof v === "string") {
        const d = new Date(v);
        clean[key] = isNaN(d.getTime()) ? null : d;
      }
    }
    return clean as T;
  }

  private async getShopId(userId: string): Promise<string> {
    let shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) {
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
      shop = await this.prisma.shop.create({
        data: { userId, name: "صفحه من", slug },
        select: { id: true },
      });
    }
    return shop.id;
  }

  async create(userId: string, dto: CreateBlockDto) {
    const shopId = await this.getShopId(userId);
    const maxOrder = await this.prisma.block.aggregate({
      where: { shopId },
      _max: { sortOrder: true },
    });
    const block = await this.prisma.block.create({
      data: {
        shopId,
        ...this.sanitize(dto),
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    await this.shops.invalidateSlugCacheByShopId(shopId);
    return block;
  }

  async findAll(userId: string) {
    const shopId = await this.getShopId(userId);
    return this.prisma.block.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async update(userId: string, id: string, dto: Partial<CreateBlockDto>) {
    const block = await this.prisma.block.findUnique({ where: { id }, include: { shop: true } });
    if (!block) throw new NotFoundException("بلوک یافت نشد");
    if (block.shop.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.block.update({ where: { id }, data: this.sanitize(dto) });
    await this.shops.invalidateSlugCacheByShopId(block.shopId);
    return updated;
  }

  async remove(userId: string, id: string) {
    const block = await this.prisma.block.findUnique({ where: { id }, include: { shop: true } });
    if (!block) throw new NotFoundException("بلوک یافت نشد");
    if (block.shop.userId !== userId) throw new ForbiddenException();
    await this.prisma.block.delete({ where: { id } });
    await this.shops.invalidateSlugCacheByShopId(block.shopId);
    return { message: "بلوک حذف شد" };
  }

  async reorder(userId: string, dto: ReorderBlocksDto) {
    const shopId = await this.getShopId(userId);
    await Promise.all(
      dto.ids.map((id, index) =>
        this.prisma.block.updateMany({
          where: { id, shopId },
          data: { sortOrder: index },
        }),
      ),
    );
    await this.shops.invalidateSlugCacheByShopId(shopId);
    return { message: "ترتیب ذخیره شد" };
  }

  /**
   * Applies a ready-made template.
   *
   * Runs as one transaction so a seller can never end up with half a page:
   * either the whole template lands or nothing changes. In "replace" mode the
   * blocks that were wiped (plus the shop's previous styling) are returned as
   * a snapshot, which the client holds in memory and can POST back to
   * /blocks/restore to undo.
   */
  async applyTemplate(userId: string, dto: ApplyTemplateDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, bioTheme: true, bioMode: true, primaryColor: true, user: { select: { plan: true } } },
    });
    const shopId = shop?.id ?? (await this.getShopId(userId));

    if (PRO_TEMPLATE_IDS.has(dto.templateId) && shop?.user?.plan !== "PRO") {
      throw new ProRequiredException();
    }

    const replace = dto.mode === "replace";

    const snapshot = replace
      ? {
          blocks: await this.prisma.block.findMany({
            where: { shopId },
            orderBy: { sortOrder: "asc" },
            select: { type: true, label: true, url: true, icon: true, data: true },
          }),
          bioTheme: shop?.bioTheme,
          bioMode: shop?.bioMode,
          primaryColor: shop?.primaryColor,
        }
      : null;

    const offset = replace
      ? 0
      : ((await this.prisma.block.aggregate({ where: { shopId }, _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;

    await this.prisma.$transaction(async (tx) => {
      if (replace) await tx.block.deleteMany({ where: { shopId } });
      await tx.block.createMany({
        data: dto.blocks.map((b, i) => ({
          shopId,
          type: b.type,
          label: b.label ?? null,
          url: b.url ?? null,
          icon: b.icon ?? null,
          data: (b.data ?? {}) as any,
          sortOrder: offset + i,
        })),
      });
      if (replace && (dto.bioTheme || dto.bioMode || dto.primaryColor)) {
        await tx.shop.update({
          where: { id: shopId },
          data: {
            ...(dto.bioTheme ? { bioTheme: dto.bioTheme } : {}),
            ...(dto.bioMode ? { bioMode: dto.bioMode } : {}),
            ...(dto.primaryColor ? { primaryColor: dto.primaryColor } : {}),
          },
        });
      }
    });

    await this.shops.invalidateSlugCacheByShopId(shopId);
    return {
      blocks: await this.prisma.block.findMany({ where: { shopId }, orderBy: { sortOrder: "asc" } }),
      snapshot,
    };
  }

  /** Undo for applyTemplate: puts back exactly what the snapshot holds. */
  async restore(userId: string, dto: RestoreBlocksDto) {
    const shopId = await this.getShopId(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.block.deleteMany({ where: { shopId } });
      if (dto.blocks.length) {
        await tx.block.createMany({
          data: dto.blocks.map((b, i) => ({
            shopId,
            type: b.type,
            label: b.label ?? null,
            url: b.url ?? null,
            icon: b.icon ?? null,
            data: (b.data ?? {}) as any,
            sortOrder: i,
          })),
        });
      }
      if (dto.bioTheme || dto.bioMode || dto.primaryColor) {
        await tx.shop.update({
          where: { id: shopId },
          data: {
            ...(dto.bioTheme ? { bioTheme: dto.bioTheme } : {}),
            ...(dto.bioMode ? { bioMode: dto.bioMode } : {}),
            ...(dto.primaryColor ? { primaryColor: dto.primaryColor } : {}),
          },
        });
      }
    });

    await this.shops.invalidateSlugCacheByShopId(shopId);
    return this.prisma.block.findMany({ where: { shopId }, orderBy: { sortOrder: "asc" } });
  }

  async recordClick(id: string) {
    const block = await this.prisma.block.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
      select: { shopId: true },
    });
    // Also log a BLOCK_CLICK analytics event — the per-shop analytics dashboard
    // counts these, and nothing was ever writing them (clicks always read 0).
    await this.prisma.analytics
      .create({ data: { shopId: block.shopId, event: "BLOCK_CLICK" } })
      .catch(() => {});
    return { ok: true };
  }
}
