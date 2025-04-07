import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../modules/activities/activities.module';
import { PackagesModule } from '../packages/packages.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    ActivitiesModule,
    PackagesModule,
    EmailModule
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService]
})
export class InvoicesModule {
  constructor() {
    console.log('🚀 InvoicesModule inicializado con soporte Prisma');
  }
} 
