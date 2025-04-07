import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletsModule } from '../wallets/wallets.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WalletsModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {} 