import { Module } from '@nestjs/common';
import { OperatorTypesService } from './operator-types.service';
import { OperatorTypesController } from './operator-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperatorTypesController],
  providers: [OperatorTypesService],
  exports: [OperatorTypesService],
})
export class OperatorTypesModule {} 