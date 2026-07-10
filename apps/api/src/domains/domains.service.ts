import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomBytes } from "crypto";
import * as dns from "dns";
import { ProRequiredException } from "../common/exceptions/pro-required.exception";
import { ArvanCdnService } from "./arvan-cdn.service";

@Injectable()
export class DomainsService {
  constructor(
    private prisma: PrismaService,
    private arvan: ArvanCdnService,
  ) {}

  async addDomain(userId: string, domain: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, include: { user: { select: { plan: true } } } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (shop.user.plan !== "PRO") throw new ProRequiredException();

    const verificationToken = `weelink-verify-${randomBytes(16).toString("hex")}`;

    return this.prisma.shop.update({
      where: { userId },
      data: {
        customDomain: domain,
        verificationToken,
        verificationStatus: "PENDING",
        verifiedAt: null,
      } as any,
      select: {
        customDomain: true,
        verificationToken: true,
        verificationStatus: true,
        verifiedAt: true,
      } as any,
    });
  }

  async getMyDomain(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      select: {
        customDomain: true,
        verificationToken: true,
        verificationStatus: true,
        verifiedAt: true,
        cdnDomainId: true,
        cdnCname: true,
        cdnStatus: true,
        cdnError: true,
      } as any,
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop;
  }

  // تلاش مجدد برای ثبت دامنه در CDN — برای وقتی دسترسی ماشین‌یوزر بعداً فعال شد
  async retryCdn(userId: string) {
    const shop = (await this.prisma.shop.findUnique({
      where: { userId },
      select: { customDomain: true, verificationStatus: true } as any,
    })) as any;
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (!shop.customDomain) throw new BadRequestException("دامنه‌ای ثبت نشده است");
    if (shop.verificationStatus !== "VERIFIED")
      throw new BadRequestException("ابتدا باید مالکیت دامنه از طریق DNS تأیید شود");

    const cdn = await this.arvan.addDomain(shop.customDomain);
    await this.prisma.shop.update({
      where: { userId },
      data: cdn.ok
        ? { cdnDomainId: cdn.cdnDomainId, cdnCname: cdn.cname, cdnStatus: cdn.status || "PENDING", cdnError: null }
        : { cdnStatus: "ERROR", cdnError: cdn.error },
    } as any);

    return cdn.ok
      ? { success: true, message: "دامنه در CDN ثبت شد" }
      : { success: false, message: cdn.error };
  }

  // بررسی وضعیت زنده‌ی CDN/SSL از آروان‌کلاود و به‌روزرسانی رکورد فروشگاه
  async refreshCdnStatus(userId: string) {
    const shop = (await this.prisma.shop.findUnique({
      where: { userId },
      select: { customDomain: true, cdnDomainId: true } as any,
    })) as any;
    if (!shop?.customDomain || !shop?.cdnDomainId) return this.getMyDomain(userId);

    const status = await this.arvan.getStatus(shop.customDomain);
    if (status.ok) {
      await this.prisma.shop.update({
        where: { userId },
        data: { cdnStatus: status.status || "PENDING", cdnCname: status.cname, cdnError: null } as any,
      });
    }
    return this.getMyDomain(userId);
  }

  // برای middleware سایت عمومی: پیدا کردن اسلاگ فروشگاه بر اساس دامنه‌ی درخواستی (بدون نیاز به احراز هویت)
  async resolveHost(host: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { customDomain: host, verificationStatus: "VERIFIED" } as any,
      select: { slug: true },
    });
    return { slug: shop?.slug ?? null };
  }

  async verifyDomain(userId: string) {
    const shop = (await this.prisma.shop.findUnique({
      where: { userId },
      select: {
        customDomain: true,
        verificationToken: true,
        verificationStatus: true,
      } as any,
    })) as any;

    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    if (!shop.customDomain)
      throw new BadRequestException("دامنه‌ای ثبت نشده است");

    const txtHost = `_weelink-verify.${shop.customDomain}`;

    try {
      const records = await dns.promises.resolveTxt(txtHost);
      const flat = records.flat();
      const matched = flat.includes(shop.verificationToken);

      if (matched) {
        await this.prisma.shop.update({
          where: { userId },
          data: {
            verificationStatus: "VERIFIED",
            verifiedAt: new Date(),
          } as any,
        });

        // مالکیت دامنه تأیید شد — حالا آن را در CDN آروان‌کلاود ثبت می‌کنیم
        // تا SSL و مسیر ترافیک به‌صورت خودکار فعال شود. اگر ماشین‌یوزر هنوز
        // دسترسی CDN نداشته باشد این تماس با خطا برمی‌گردد ولی روند تأیید
        // TXT شکسته نمی‌شود — کاربر می‌تواند بعداً «تلاش مجدد CDN» بزند.
        const cdn = await this.arvan.addDomain(shop.customDomain);
        await this.prisma.shop.update({
          where: { userId },
          data: cdn.ok
            ? {
                cdnDomainId: cdn.cdnDomainId,
                cdnCname: cdn.cname,
                cdnStatus: cdn.status || "PENDING",
                cdnError: null,
              }
            : { cdnStatus: "ERROR", cdnError: cdn.error },
        } as any);

        return { success: true, message: "دامنه با موفقیت تأیید شد" };
      } else {
        return {
          success: false,
          message: `رکورد TXT یافت شد اما مقدار مطابقت ندارد. مقدار مورد انتظار: ${shop.verificationToken}`,
        };
      }
    } catch {
      return {
        success: false,
        message: `رکورد TXT برای ${txtHost} یافت نشد. لطفاً DNS خود را بررسی کنید`,
      };
    }
  }

  async removeDomain(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

    if ((shop as any).customDomain) {
      await this.arvan.removeDomain((shop as any).customDomain);
    }

    await this.prisma.shop.update({
      where: { userId },
      data: {
        customDomain: null,
        verificationToken: null,
        verificationStatus: null,
        verifiedAt: null,
        cdnDomainId: null,
        cdnCname: null,
        cdnStatus: null,
        cdnError: null,
      } as any,
    });

    return { message: "دامنه با موفقیت حذف شد" };
  }
}
