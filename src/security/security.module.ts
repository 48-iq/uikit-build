import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from './jwt.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        issuer: configService.getOrThrow<string>('JWT_ISSUER'),
        audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
        algorithm: configService.getOrThrow<string>('JWT_ALGORITHM'),
        expTime: configService.getOrThrow<number>('JWT_EXP_TIME'),
        
      }),
    }),
  ],
  providers: [JwtGuard],
  exports: [JwtGuard],
})
export class SecurityModule {}
