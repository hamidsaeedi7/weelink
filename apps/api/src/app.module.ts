import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "path";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ShopsModule } from "./shops/shops.module";
import { BlocksModule } from "./blocks/blocks.module";
import { UploadModule } from "./upload/upload.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { CouponsModule } from "./coupons/coupons.module";
import { PaymentsModule } from "./payments/payments.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { TicketsModule } from "./tickets/tickets.module";
import { AdminModule } from "./admin/admin.module";
import { EmailModule } from "./email/email.module";
import { DomainsModule } from "./domains/domains.module";
import { AbTestsModule } from "./ab-tests/ab-tests.module";
import { ShippingModule } from "./shipping/shipping.module";
import { ContentPlansModule } from "./content-plans/content-plans.module";
import { DigitalFilesModule } from "./digital-files/digital-files.module";
import { CoursesModule } from "./courses/courses.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { ShortLinksModule } from "./short-links/short-links.module";
import { AudienceModule } from "./audience/audience.module";
import { AffiliateModule } from "./affiliate/affiliate.module";
import { AutoReplyModule } from "./auto-reply/auto-reply.module";
import { FlashSalesModule } from "./flash-sales/flash-sales.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: "../../.env" }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), "..", "..", "uploads"),
      serveRoot: "/uploads",
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    BlocksModule,
    UploadModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    PaymentsModule,
    AnalyticsModule,
    TicketsModule,
    AdminModule,
    EmailModule,
    DomainsModule,
    AbTestsModule,
    ShippingModule,
    ContentPlansModule,
    DigitalFilesModule,
    CoursesModule,
    AppointmentsModule,
    ShortLinksModule,
    AudienceModule,
    AffiliateModule,
    AutoReplyModule,
    FlashSalesModule,
  ],
})
export class AppModule {}
