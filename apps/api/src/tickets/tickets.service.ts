import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketDto, ReplyTicketDto } from "./dto/ticket.dto";

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: { userId, ...dto },
      include: { replies: true },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
  }

  async findOne(userId: string, id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!ticket) throw new NotFoundException();
    if (ticket.userId !== userId) throw new ForbiddenException();
    return ticket;
  }

  async reply(userId: string, id: string, dto: ReplyTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException();
    if (ticket.userId !== userId) throw new ForbiddenException();

    const [, reply] = await Promise.all([
      this.prisma.ticket.update({
        where: { id },
        data: { status: "IN_PROGRESS", updatedAt: new Date() },
      }),
      this.prisma.ticketReply.create({
        data: { ticketId: id, authorId: userId, isAdmin: false, message: dto.message },
      }),
    ]);
    return reply;
  }

  async close(userId: string, id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException();
    if (ticket.userId !== userId) throw new ForbiddenException();
    return this.prisma.ticket.update({ where: { id }, data: { status: "CLOSED" } });
  }
}
