import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isMock: boolean;
  private readonly apiKey: string;
  private readonly template: string;

  constructor(private config: ConfigService) {
    this.isMock = config.get("SMS_PROVIDER", "mock") === "mock";
    this.apiKey = config.get("SMS_API_KEY", "");
    this.template = config.get("KAVENEGAR_OTP_TEMPLATE", "Vlink");
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    if (this.isMock) {
      this.logger.warn(`[MOCK SMS] → ${phone}: ${message}`);
      return true;
    }

    const url = `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`;
    const params = new URLSearchParams({
      receptor: phone,
      message,
      sender: this.config.get("SMS_SENDER", ""),
    });

    try {
      const res = await fetch(`${url}?${params.toString()}`);
      const data: any = await res.json();
      if (!res.ok || data?.return?.status !== 200) {
        this.logger.error(`Kavenegar sendSms failed: ${JSON.stringify(data)}`);
        return false;
      }
      this.logger.log(`SMS sent to ${phone}`);
      return true;
    } catch (err) {
      this.logger.error(`Kavenegar sendSms error: ${err}`);
      return false;
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (this.isMock) {
      this.logger.warn(`[MOCK SMS] → ${phone}: کد تأیید ${code}`);
      return true;
    }

    const url = `https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json`;
    const params = new URLSearchParams({
      receptor: phone,
      token: code,
      template: this.template,
    });

    try {
      const res = await fetch(`${url}?${params.toString()}`);
      const data: any = await res.json();
      if (!res.ok || data?.return?.status !== 200) {
        this.logger.error(`Kavenegar OTP failed for ${phone}: ${JSON.stringify(data)}`);
        return false;
      }
      this.logger.log(`OTP sent to ${phone}`);
      return true;
    } catch (err) {
      this.logger.error(`Kavenegar OTP error for ${phone}: ${err}`);
      return false;
    }
  }

  async sendWelcome(phone: string): Promise<boolean> {
    const message =
      "به ویلینک خوش آمدید\n" +
      "هدیه ویلینک🎁 ۷ روز پلن PRO برای شما فعال شد\n" +
      "⚡️ویلینک، همه در یک لینک";
    return this.sendSms(phone, message);
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
