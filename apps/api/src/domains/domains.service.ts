import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomBytes } from "crypto";
import * as dns from "dns";

@Injectable()
export class DomainsService {
  constructor(private prisma: PrismaService) {}

  async addDomain(userId: string, domain: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");

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
      } as any,
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    return shop;
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

    await this.prisma.shop.update({
      where: { userId },
      data: {
        customDomain: null,
        verificationToken: null,
        verificationStatus: null,
        verifiedAt: null,
      } as any,
    });

    return { message: "دامنه با موفقیت حذف شد" };
  }
}
