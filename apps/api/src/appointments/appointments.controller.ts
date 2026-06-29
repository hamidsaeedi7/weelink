import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/appointments")
export class AppointmentsPublicController {
  constructor(private svc: AppointmentsService) {}

  @Get("services")
  getServicesPublic(@Param("slug") slug: string) { return this.svc.getServicesPublic(slug); }

  @Post("book")
  createBooking(@Body() dto: any) { return this.svc.createBooking(dto); }
}

@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private svc: AppointmentsService) {}

  @Get("services")
  getServices(@CurrentUser() user: { id: string }) { return this.svc.getServices(user.id); }

  @Post("services")
  createService(@CurrentUser() user: { id: string }, @Body() dto: any) { return this.svc.createService(user.id, dto); }

  @Put("services/:id")
  updateService(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.updateService(user.id, id, dto);
  }

  @Delete("services/:id")
  removeService(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.removeService(user.id, id); }

  @Get("bookings")
  getBookings(@CurrentUser() user: { id: string }) { return this.svc.getBookings(user.id); }

  @Put("bookings/:id")
  updateBooking(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.updateBooking(user.id, id, dto);
  }
}
