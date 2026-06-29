import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AutoReplyService } from "./auto-reply.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("auto-reply")
@UseGuards(JwtAuthGuard)
export class AutoReplyController {
  constructor(private svc: AutoReplyService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: any) { return this.svc.create(user.id, dto); }

  @Put(":id")
  update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }
}
