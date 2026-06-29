import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { Response } from "express";

const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

@Controller("payments")
export class PaymentsController {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
  ) {}

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
