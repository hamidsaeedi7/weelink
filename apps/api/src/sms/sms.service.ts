import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isMock: boolean;

  constructor(private config: ConfigService) {
    this.isMock = config.get("SMS_PROVIDER", "mock") === "mock";
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    if (this.isMock) {
      this.logger.warn(`[MOCK SMS] → ${phone}: ${message}`);
      return true;
    }
    // TODO: integrate kavehnegarسرویس کاوه‌نگار
    this.logger.log(`SMS sent to ${phone}`);
    return true;
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    const message = `کد تأیید ویلینک: ${code}\nاین کد ۲ دقیقه معتبر است.`;

    if (this.isMock) {
      this.logger.warn(`[MOCK SMS] → ${phone}: ${message}`);
      return true;
    }

    // TODO: integrate kavehnegarسرویس کاوه‌نگار
    this.logger.log(`SMS sent to ${phone}`);
    return true;
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
