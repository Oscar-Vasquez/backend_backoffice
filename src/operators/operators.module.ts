import { Module } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OperatorsCacheService } from './operators-cache.service';

@Module({
  imports: [PrismaModule],
  controllers: [OperatorsController],
  providers: [OperatorsService, OperatorsCacheService],
  exports: [OperatorsService],
})
export class OperatorsModule {} 