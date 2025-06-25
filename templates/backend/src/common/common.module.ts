import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { CommonService } from './common.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [CommonService, PrismaService],
  exports: [CommonService, PrismaService],
})
export class CommonModule {}
