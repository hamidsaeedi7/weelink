import { Module } from '@nestjs/common';
import { ContentPlansService } from './content-plans.service';
import { ContentSchedulerService } from './scheduler.service';
import { TelegramService } from './telegram.service';
import { ContentPlansController, TelegramWebhookController } from './content-plans.controller';
import { SmsModule } from '../sms/sms.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SmsModule, EmailModule],
  providers: [ContentPlansService, ContentSchedulerService, TelegramService],
  controllers: [ContentPlansController, TelegramWebhookController],
  exports: [TelegramService],
})
export class ContentPlansModule {}
