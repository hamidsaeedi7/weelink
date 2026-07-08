import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require("compression");
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

const WEAK_SECRET_VALUES = new Set([
  "",
  "change_this_to_a_very_long_random_secret_access",
  "change_this_to_a_very_long_random_secret_refresh",
]);

function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || WEAK_SECRET_VALUES.has(accessSecret)) {
    throw new Error("JWT_ACCESS_SECRET is missing or using the default placeholder value");
  }
  if (!refreshSecret || WEAK_SECRET_VALUES.has(refreshSecret)) {
    throw new Error("JWT_REFRESH_SECRET is missing or using the default placeholder value");
  }
  if (accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || frontendUrl.includes("localhost")) {
    throw new Error("FRONTEND_URL must be set to the production domain");
  }
}

async function bootstrap() {
  assertProductionConfig();

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });

  app.use(helmet());
  app.use(compression());

  // Also allow the www. variant of each configured origin — the site resolves
  // and serves identical content on both www.weeelink.ir and weeelink.ir, but a
  // bare origin list only matching the apex domain silently CORS-blocks every
  // API call (loading, adding blocks, everything) for visitors on the www host.
  const withWwwVariant = (url: string) => {
    try {
      const u = new URL(url);
      const alt = u.hostname.startsWith("www.")
        ? u.hostname.slice(4)
        : `www.${u.hostname}`;
      return [url, `${u.protocol}//${alt}`];
    } catch {
      return [url];
    }
  };
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.ADMIN_URL || "http://localhost:3001",
  ].flatMap(withWwwVariant);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  app.setGlobalPrefix(process.env.API_PREFIX || "api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Weelink API running on: http://localhost:${port}/api/v1`);
}

bootstrap();
