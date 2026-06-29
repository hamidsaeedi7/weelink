import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { CreateTicketDto, ReplyTicketDto } from "./dto/ticket.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("tickets")
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.tickets.findAllForUser(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.tickets.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTicketDto) {
    return this.tickets.create(user.id, dto);
  }

  @Post(":id/reply")
  reply(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: ReplyTicketDto,
  ) {
    return this.tickets.reply(user.id, id, dto);
  }

  @Put(":id/close")
  close(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.tickets.close(user.id, id);
  }
}
