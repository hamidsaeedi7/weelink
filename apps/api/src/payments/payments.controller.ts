import { Body, Controller, Get, Post, Query, Res, UseGuards } from "@nestjs/common";
import { IsIn, IsNumber, IsString } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { PrismaService } from "../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Response } from "express";

const WEB_URL = process.env.WEB_URL || process.env.FRONTEND_URL || "http://localhost:3000";
const PRO_PLAN_MONTHS = [1, 3, 6, 12, 999];

class RequestPlanPaymentDto {
  @IsNumber() @IsIn(PRO_PLAN_MONTHS) months: number;
}

class VerifyPlanPaymentDto {
  @IsString() trackId: string;
  @IsString() success: string;
}

@Controller("payments")
export class PaymentsController {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  /** PRO plan upgrade — request Zibal payment (requires login, server computes price) */
  @Post("plan/request")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async requestPlanPayment(@CurrentUser() user: { id: string }, @Body() dto: RequestPlanPaymentDto) {
    const callbackUrl = `${WEB_URL}/payment/plan-callback`;
    return this.paymentsService.requestPlanPayment(user.id, dto.months, callbackUrl);
  }

  /** PRO plan upgrade — verify after Zibal redirects back */
  @Post("plan/verify")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async verifyPlanPayment(@Body() dto: VerifyPlanPaymentDto) {
    return this.paymentsService.verifyPlanPayment(dto.trackId, dto.success);
  }

  /** Step 1 — Request payment token */
  @Post("request")
  async requestPayment(@Body() body: { orderNumber: string; amount: number; callbackUrl: string }) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber: body.orderNumber } });
    if (!order) return { status: 0, error: "سفارش یافت نشد" };

    const token = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await this.prisma.order.update({
      where: { orderNumber: body.orderNumber },
      data: { paymentRef: token },
    });

    return {
      status: 100,
      authority: token,
      paymentUrl: `${WEB_URL}/payment/mock?authority=${token}&orderNumber=${body.orderNumber}&amount=${body.amount}`,
    };
  }

  /** Step 2 — Verify after callback */
  @Post("verify")
  async verifyPayment(@Body() body: { authority: string; orderNumber: string }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: body.orderNumber },
    });

    if (!order || order.paymentRef !== body.authority) {
      return { status: 0, error: "تراکنش نامعتبر است" };
    }

    if (order.paymentStatus === "PAID") {
      return { status: 101, message: "تراکنش قبلاً تأیید شده است", refId: order.paymentRef };
    }

    await this.orders.updatePayment(body.orderNumber, body.authority);
    return { status: 100, refId: body.authority, message: "پرداخت موفق" };
  }
}
