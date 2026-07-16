import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get("REDIS_HOST", "localhost"),
      port: this.config.get<number>("REDIS_PORT", 6379),
      password: this.config.get("REDIS_PASSWORD"),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    this.client.on("connect", () => this.logger.log("Redis connected"));
    this.client.on("error", (err) => this.logger.error("Redis error", err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** Atomically increments a counter, setting its TTL only on first creation. Returns the new count. */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttlSeconds);
    return count;
  }
}
