import { Inject } from "@nestjs/common";

export function InjectRedis(): ParameterDecorator {
  return Inject('REDIS_CLIENT');
}