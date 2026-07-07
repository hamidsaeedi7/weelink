import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { OrdersService } from "./orders.service";
import { InvoiceService } from "./invoice.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("orders")
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private invoice: InvoiceService,
  ) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  findMine(
    @CurrentUser() user: { id: string },
    @Query("page") page?: number,
    @Query("status") status?: string,
  ) {
    return this.orders.findAllForOwner(user.id, page, status);
  }

  @Put(":id/status")
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user.id, id, dto);
  }

  /** Seller manually confirms a card-to-card bank transfer was received. */
  @Put(":id/mark-paid")
  @UseGuards(JwtAuthGuard)
  markPaid(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.orders.markPaid(user.id, id);
  }

  @Get(":id/invoice")
  @UseGuards(JwtAuthGuard)
  async getInvoice(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    const html = await this.invoice.generateInvoiceHtml(id, user.id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }
}
