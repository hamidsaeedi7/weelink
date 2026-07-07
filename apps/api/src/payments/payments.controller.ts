import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsIn, IsNumber, IsString } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

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
  constructor(private paymentsService: PaymentsService) {}

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
}
