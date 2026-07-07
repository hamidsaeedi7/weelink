import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "../payments/payments.service";
import { CouponsService } from "../coupons/coupons.service";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";
import { PurchaseCourseDto, RedeemLicenseDto } from "./dto/course.dto";

const API_URL = process.env.API_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "";
const ACCESS_TOKEN_EXPIRES = "90d";
const STREAM_TOKEN_EXPIRES_SECONDS = 3 * 3600; // 3h

// Human-friendly license code: 4 groups of 4 uppercase alnum chars (no ambiguous 0/O/1/I).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateLicenseCode(): string {
  const groups = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join(""),
  );
  return groups.join("-");
}

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private coupons: CouponsService,
    private jwt: JwtService,
  ) {}

  private async getShopId(userId: string, requirePro = false) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: { id: true, user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (requirePro && (shop as any).user.plan !== "PRO")
      throw new ProRequiredException();
    return shop.id;
  }

  private serialize(c: any) {
    return { ...c, price: c.price?.toString() };
  }

  async create(userId: string, dto: any) {
    const shopId = await this.getShopId(userId);
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
      select: {
        id: true, title: true, description: true, coverUrl: true, price: true, isFree: true,
        watermarkText: true, watermarkColor: true, watermarkCount: true,
        chapters: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, isPreview: true, sortOrder: true, videos: true },
        },
      },
    });
    // strip video urls from non-preview chapters so paid content isn't leaked publicly
    return courses.map((c: any) =>
      this.serialize({
        ...c,
        chapters: c.chapters.map((ch: any) => ({
          id: ch.id,
          title: ch.title,
          isPreview: ch.isPreview,
          videoCount: Array.isArray(ch.videos) ? ch.videos.length : 0,
          videos: ch.isPreview ? ch.videos : [],
        })),
      }),
    );
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

  // ─── Purchase / license (gateway-only) ────────────────────────────────────

  /** Buyer-facing purchase — gateway-only (no card-to-card), requires name + phone. */
  async purchase(slug: string, courseId: string, dto: PurchaseCourseDto) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.shopId !== shop.id || !course.isActive) throw new NotFoundException("دوره یافت نشد");

    if (course.isFree || course.price <= 0n) {
      const enrollment = await this.prisma.courseEnrollment.create({
        data: {
          courseId,
          customerName: dto.buyerName,
          customerPhone: dto.buyerPhone,
          amountPaid: 0n,
          paymentStatus: "PAID",
        },
      });
      const license = await this.issueLicense(enrollment);
      return { free: true, licenseCode: license.code };
    }

    let finalPrice = Number(course.price);
    if (dto.couponCode) {
      const result = await this.coupons.validate({
        code: dto.couponCode,
        total: finalPrice,
        itemType: "COURSE",
        itemIds: [courseId],
      });
      finalPrice = Math.max(0, result.finalPrice);
    }

    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        courseId,
        customerName: dto.buyerName,
        customerPhone: dto.buyerPhone,
        amountPaid: BigInt(finalPrice),
        paymentStatus: "UNPAID",
      },
    });

    if (finalPrice <= 0) {
      await this.prisma.courseEnrollment.update({ where: { id: enrollment.id }, data: { paymentStatus: "PAID" } });
      if (dto.couponCode) await this.coupons.incrementUsage(dto.couponCode);
      const license = await this.issueLicense(enrollment);
      return { free: true, licenseCode: license.code };
    }

    const { authority, gatewayUrl } = await this.payments.requestGatewayPayment({
      shopId: shop.id,
      type: "COURSE",
      refId: enrollment.id,
      amount: finalPrice * 10, // Toman → Rial
      buyerName: dto.buyerName,
      buyerPhone: dto.buyerPhone,
      description: `ثبت‌نام دوره: ${course.title}`,
      callbackUrl: `${API_URL}/api/v1/payments/gateway/callback`,
    });

    await this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { paymentRef: authority, couponCode: dto.couponCode?.toUpperCase() },
    });
    return { free: false, gatewayUrl };
  }

  private async issueLicense(enrollment: { id: string; courseId: string; customerName: string | null; customerPhone: string }) {
    const existing = await this.prisma.license.findUnique({ where: { enrollmentId: enrollment.id } });
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateLicenseCode();
      try {
        return await this.prisma.license.create({
          data: {
            code,
            courseId: enrollment.courseId,
            enrollmentId: enrollment.id,
            buyerName: enrollment.customerName || "",
            buyerPhone: enrollment.customerPhone,
          },
        });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e; // unique clash on code → retry with a new one
      }
    }
    throw new BadRequestException("خطا در تولید کد لایسنس");
  }

  /** Called by the gateway callback once Zarinpal confirms payment. Idempotent. */
  async finalizeEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: { include: { shop: { select: { slug: true } } } } },
    });
    if (!enrollment) throw new NotFoundException("ثبت‌نام یافت نشد");
    if (enrollment.paymentStatus !== "PAID") {
      await this.prisma.courseEnrollment.update({ where: { id: enrollmentId }, data: { paymentStatus: "PAID" } });
      if (enrollment.couponCode) await this.coupons.incrementUsage(enrollment.couponCode);
    }
    const license = await this.issueLicense(enrollment);
    return { licenseCode: license.code, courseId: enrollment.courseId, shopSlug: enrollment.course.shop.slug };
  }

  /** License redemption — buyer logs in with code+phone to get an on-site access token. */
  async redeemLicense(dto: RedeemLicenseDto) {
    const code = dto.code.trim().toUpperCase();
    const license = await this.prisma.license.findUnique({ where: { code }, include: { course: true } });
    if (!license || !license.isActive || license.buyerPhone !== dto.phone) {
      throw new BadRequestException("کد لایسنس یا شماره موبایل نادرست است");
    }

    await this.prisma.license.update({ where: { id: license.id }, data: { lastAccessAt: new Date() } });

    const accessToken = this.jwt.sign(
      { purpose: "course-access", licenseId: license.id, courseId: license.courseId },
      { secret: JWT_SECRET, expiresIn: ACCESS_TOKEN_EXPIRES },
    );

    return {
      accessToken,
      courseId: license.courseId,
      courseTitle: license.course.title,
      buyerName: license.buyerName,
      buyerPhone: license.buyerPhone,
    };
  }

  private verifyAccessToken(token: string, courseId: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: JWT_SECRET });
    } catch {
      throw new UnauthorizedException("دسترسی نامعتبر است، دوباره وارد شوید");
    }
    if (payload?.purpose !== "course-access" || payload.courseId !== courseId) {
      throw new UnauthorizedException("دسترسی نامعتبر است");
    }
    return payload;
  }

  /** Signs a short-lived streaming URL for a chapter's video (locked/anti-hotlink). */
  async getSignedVideoUrl(courseId: string, chapterId: string, videoIndex: number, accessToken?: string) {
    const chapter = await this.prisma.courseChapter.findUnique({ where: { id: chapterId } });
    if (!chapter || chapter.courseId !== courseId) throw new NotFoundException("فصل یافت نشد");

    if (!chapter.isPreview) {
      if (!accessToken) throw new UnauthorizedException("برای مشاهده این فصل باید دوره را خریداری کنید");
      this.verifyAccessToken(accessToken, courseId);
    }

    const videos = Array.isArray(chapter.videos) ? (chapter.videos as any[]) : [];
    const video = videos[videoIndex];
    const src: string | undefined = video?.videoUrl || chapter.videoUrl || undefined;
    if (!src) throw new NotFoundException("ویدیو یافت نشد");

    // External embeds (YouTube/Aparat) have no local file to protect — return as-is.
    if (!src.startsWith("/uploads/")) return { url: src, embed: true };

    const streamToken = this.jwt.sign(
      { purpose: "stream", path: src },
      { secret: JWT_SECRET, expiresIn: STREAM_TOKEN_EXPIRES_SECONDS },
    );
    return { url: `${API_URL}/api/v1/stream/video?token=${streamToken}`, embed: false };
  }

  /** Used by StreamController to validate a signed video token before serving bytes. */
  verifyStreamToken(token: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: JWT_SECRET });
    } catch {
      throw new UnauthorizedException("لینک نامعتبر یا منقضی شده است");
    }
    if (payload?.purpose !== "stream" || typeof payload.path !== "string" || !payload.path.startsWith("/uploads/videos/")) {
      throw new UnauthorizedException("لینک نامعتبر است");
    }
    return payload.path as string;
  }
}
