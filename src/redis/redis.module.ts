import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
 providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService): Redis => {
        const client = new Redis({
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: +config.getOrThrow<string>('REDIS_PORT'),
          password: config.getOrThrow<string>('REDIS_PASSWORD'),
          retryStrategy: (times) => Math.min(times * 200, 5000),
        });

        client.on('error', (err) => console.error('[Redis] error:', err));
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}