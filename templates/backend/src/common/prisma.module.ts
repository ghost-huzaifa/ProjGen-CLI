import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantMiddleware } from '../middleware/tenant.middleware';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
