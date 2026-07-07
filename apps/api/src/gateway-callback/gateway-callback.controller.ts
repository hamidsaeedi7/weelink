import { Controller, Get, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { PaymentsService } from "../payments/payments.service";
import { DigitalFilesService } from "../digital-files/digital-files.service";
import { CoursesService } from "../courses/courses.service";
import { OrdersService } from "../orders/orders.service";

const WEB_URL = process.env.WEB_URL || process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Weelink Zarinpal gateway — shared platform merchant used for digital-file/course/product
 * purchases (10% platform fee ledger). Zarinpal redirects the buyer's browser here via GET
 * with ?Authority=...&Status=OK|NOK after they finish/cancel payment. Lives in its own module
 * (rather than PaymentsModule) so it can depend on DigitalFilesModule/CoursesModule/OrdersModule
 * without creating a circular import (those modules depend on PaymentsModule, not vice versa).
 */
@Controller("payments/gateway")
export class GatewayCallbackController {
  constructor(
    private payments: PaymentsService,
    private digitalFiles: DigitalFilesService,
    private courses: CoursesService,
    private orders: OrdersService,
  ) {}

  @Get("callback")
  async callback(@Query("Authority") authority: string, @Query("Status") status: string, @Res() res: Response) {
    try {
      const result = await this.payments.verifyGatewayPayment(authority, status);

      if (result.type === "DIGITAL_FILE" && result.refId) {
        const { downloadUrl } = await this.digitalFiles.finalizePurchase(result.refId);
        res.redirect(302, `${WEB_URL}/payment/result?status=success&type=DIGITAL_FILE&downloadUrl=${encodeURIComponent(downloadUrl)}`);
        return;
      }

      if (result.type === "COURSE" && result.refId) {
        const { licenseCode, courseId, shopSlug } = await this.courses.finalizeEnrollment(result.refId);
        const params = new URLSearchParams({
          status: "success", type: "COURSE", license: licenseCode, courseId, shopSlug,
        });
        res.redirect(302, `${WEB_URL}/payment/result?${params.toString()}`);
        return;
      }

      if (result.type === "PRODUCT" && result.refId) {
        const { orderNumber } = await this.orders.finalizeOrder(result.refId);
        res.redirect(302, `${WEB_URL}/payment/result?status=success&type=PRODUCT&orderNumber=${encodeURIComponent(orderNumber)}`);
        return;
      }

      res.redirect(302, `${WEB_URL}/payment/result?status=success&ref=${result.refNumber}`);
    } catch (e: any) {
      res.redirect(302, `${WEB_URL}/payment/result?status=failed`);
    }
  }
}
