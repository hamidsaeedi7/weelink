import { Module } from "@nestjs/common";
import { AutoReplyController, AutoReplyWebhookController } from "./auto-reply.controller";
import { AutoReplyService } from "./auto-reply.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AutoReplyController, AutoReplyWebhookController],
  providers: [AutoReplyService],
})
export class AutoReplyModule {}
