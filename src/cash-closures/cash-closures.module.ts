import { Module } from '@nestjs/common';
import { CashClosuresService } from './cash-closures.service';
import { CashClosuresController } from './cash-closures.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { CashClosuresCronService } from './cash-closures.cron';

@Module({
  imports: [TransactionsModule],
  controllers: [CashClosuresController],
  providers: [CashClosuresService, PrismaService, CashClosuresCronService],
  exports: [CashClosuresService]
})
export class CashClosuresModule {} 