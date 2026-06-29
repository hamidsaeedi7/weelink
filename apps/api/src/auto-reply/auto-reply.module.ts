import { Module } from "@nestjs/common";
import { AutoReplyController } from "./auto-reply.controller";
import { AutoReplyService } from "./auto-reply.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AutoReplyController],
  providers: [AutoReplyService],
})
export class AutoReplyModule {}
