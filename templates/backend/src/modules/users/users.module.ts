import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [UsersController],
  providers: [JwtService, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
