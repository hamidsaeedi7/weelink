import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { SmsService } from "../sms/sms.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwt: JwtService,
    private config: ConfigService,
    private sms: SmsService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException("شماره موبایل یا ایمیل الزامی است");
    }

    if (dto.phone) {
      const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (exists) throw new ConflictException("این شماره موبایل قبلاً ثبت شده است");

      const code = this.sms.generateOtp();
      await this.redis.set(`otp:${dto.phone}`, code, 120);
      await this.sms.sendOtp(dto.phone, code);

      return { message: "کد تأیید ارسال شد", phone: dto.phone };
    }

    if (dto.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new ConflictException("این ایمیل قبلاً ثبت شده است");
      if (!dto.password) throw new BadRequestException("رمز عبور الزامی است");

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = await this.prisma.user.create({
        data: { email: dto.email, passwordHash, isVerified: true },
      });

      await this.createDefaultShop(user.id, dto.email.split("@")[0]);
      return this.generateTokens(user.id, user.role);
    }
  }

  // ─── Verify OTP ──────────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(`otp:${dto.phone}`);
    if (!stored || stored !== dto.code) {
      throw new BadRequestException("کد تأیید اشتباه یا منقضی شده است");
    }

    await this.redis.del(`otp:${dto.phone}`);

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    const isNew = !user;
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: dto.phone, isVerified: true },
      });
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    if (isNew) {
      const slug = dto.phone.replace(/\D/g, "").slice(-8);
      await this.createDefaultShop(user.id, slug);
    }

    return this.generateTokens(user.id, user.role);
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException("ایمیل یا شماره موبایل الزامی است");
    }

    const user = dto.email
      ? await this.prisma.user.findUnique({ where: { email: dto.email } })
      : await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("اطلاعات ورود اشتباه است");
    }
    if (user.isBlocked) {
      throw new UnauthorizedException("حساب کاربری مسدود شده است");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("اطلاعات ورود اشتباه است");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.role);
  }

  // ─── Send Phone OTP (for login) ──────────────────────────────────────────────

  async sendLoginOtp(phone: string) {
    const code = this.sms.generateOtp();
    await this.redis.set(`otp:login:${phone}`, code, 120);
    await this.sms.sendOtp(phone, code);
    return { message: "کد ورود ارسال شد" };
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────────

  async refresh(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBlocked) throw new UnauthorizedException();
    return this.generateTokens(user.id, user.role);
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    if (dto.phone) {
      const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (!user) return { message: "کد بازیابی ارسال شد" };

      const code = this.sms.generateOtp();
      await this.redis.set(`reset:${dto.phone}`, code, 300);
      await this.sms.sendOtp(dto.phone, code);
    }
    return { message: "کد بازیابی ارسال شد" };
  }

  // ─── Reset Password ──────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const stored = await this.redis.get(`reset:${dto.token}`);
    if (!stored || stored !== dto.code) {
      throw new BadRequestException("کد بازیابی اشتباه یا منقضی شده است");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { phone: dto.token },
      data: { passwordHash },
    });
    await this.redis.del(`reset:${dto.token}`);

    return { message: "رمز عبور با موفقیت تغییر کرد" };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async createDefaultShop(userId: string, baseSlug: string) {
    const clean = baseSlug.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20) || "user";
    let slug = clean;
    let suffix = 1;
    while (await this.prisma.shop.findUnique({ where: { slug } })) {
      slug = `${clean}${suffix++}`;
    }
    await this.prisma.shop.create({
      data: { userId, name: "صفحه من", slug },
    });
  }

  private generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get("JWT_ACCESS_EXPIRES", "15m"),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get("JWT_REFRESH_EXPIRES", "7d"),
    });
    return { accessToken, refreshToken };
  }
}
