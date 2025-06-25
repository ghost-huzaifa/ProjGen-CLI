import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppConfigModule } from './config/config.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from '@common/guards/auth.guard';
import { JwtStrategy } from '@modules/auth/strategies/jwt.strategy';

@Module({
  imports: [AppConfigModule, CommonModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    JwtStrategy,
  ],
})
export class AppModule {}
