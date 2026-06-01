import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Build } from 'src/postgres/entities/build.entity';
import { InjectRedis } from 'src/redis/redis.decorator';
import { Repository } from 'typeorm';

@Injectable()
export class BuildLogService {
  private readonly KEY_PREFIX = 'build:logs:';
  private readonly TTL_SECONDS = 60 * 60 * 24;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(Build) private readonly buildRepository: Repository<Build>,
  ) {}

  async append(
    buildId: string,
    message: string,
    level: 'info' | 'warn' | 'error' | 'debug',
  ) {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] `;
    const logLine = `${prefix}${message}`;
    const key = `${this.KEY_PREFIX}${buildId}`;
    await this.redis.rpush(key, logLine);
    await this.redis.expire(key, this.TTL_SECONDS);
  }

  async flush(buildId: string) {
    const key = `${this.KEY_PREFIX}${buildId}`;
    const lines = await this.redis.lrange(key, 0, -1);
    const logs = lines.join('\n') + '\n';

    await this.buildRepository.update({ id: buildId }, { logs });
    await this.redis.del(key);
  }
}
