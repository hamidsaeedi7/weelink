import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { emailTemplates } from './templates';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — email sending disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async onModuleInit() {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully.');
    } catch (err: any) {
      this.logger.warn(`SMTP connection failed: ${err?.message ?? err}`);
    }
  }

  /** Send a raw email with custom subject and HTML body */
  async sendRaw(to: string, subject: string, html: string): Promise<void> {
    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email skipped (SMTP not configured): ${subject} -> ${to}`);
      return;
    }
    try {
      const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent: "${subject}" -> ${to}`);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message ?? err}`);
    }
  }

  /** Welcome email on registration */
  async sendWelcome(email: string, name: string): Promise<void> {
    await this.send(
      email,
      `به ویلینک خوش آمدید، ${name}!`,
      emailTemplates.welcome(name),
    );
  }

  /** OTP code email */
  async sendOtp(email: string, otp: string): Promise<void> {
    await this.send(
      email,
      'کد تأیید ویلینک',
      emailTemplates.otp(otp),
    );
  }

  /** Password reset email with token + code */
  async sendPasswordReset(
    email: string,
    token: string,
    code: string,
  ): Promise<void> {
    await this.send(
      email,
      'بازیابی رمز عبور ویلینک',
      emailTemplates.passwordReset(token, code),
    );
  }

  /** Order confirmation after placing an order */
  async sendOrderConfirmation(
    email: string,
    order: {
      orderNumber: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      shopName: string;
    },
  ): Promise<void> {
    await this.send(
      email,
      `تأییدیه سفارش #${order.orderNumber}`,
      emailTemplates.orderConfirmation(order),
    );
  }

  /** Order status update notification */
  async sendOrderStatusUpdate(
    email: string,
    orderNumber: string,
    status: string,
    shopName: string,
  ): Promise<void> {
    await this.send(
      email,
      `بروزرسانی وضعیت سفارش #${orderNumber}`,
      emailTemplates.orderStatusUpdate(orderNumber, status, shopName),
    );
  }

  /** Subscription renewal reminder */
  async sendSubscriptionRenewal(
    email: string,
    expiresAt: Date,
    plan: string,
  ): Promise<void> {
    await this.send(
      email,
      'یادآوری تمدید اشتراک ویلینک',
      emailTemplates.subscriptionRenewal(expiresAt, plan),
    );
  }

  /** Subscription confirmation after upgrade/purchase */
  async sendSubscriptionConfirmation(
    email: string,
    plan: string,
    months: number,
    price: number,
  ): Promise<void> {
    await this.send(
      email,
      'تأییدیه اشتراک ویلینک',
      emailTemplates.subscriptionConfirmation(plan, months, price),
    );
  }
}
